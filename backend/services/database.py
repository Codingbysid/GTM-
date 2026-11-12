import os
import json
import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pathlib import Path
import aiosqlite
from models import LeadRecord, TelemetryMetrics, PipelineTraceStep

DB_PATH = Path(__file__).parent.parent / "gtm_leads.db"

def get_supabase_client():
    """Returns Supabase client if credentials are configured in environment."""
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip() or os.getenv("SUPABASE_KEY", "").strip()
    if url and key:
        try:
            from supabase import create_client, Client
            return create_client(url, key)
        except Exception as e:
            print(f"[Supabase Init Warning] Could not initialize Supabase client: {e}")
            return None
    return None


async def init_db():
    """Initializes local SQLite database table if it doesn't already exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS gtm_leads (
                id TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                domain TEXT NOT NULL UNIQUE,
                contact_role TEXT NOT NULL,
                industry TEXT NOT NULL,
                employee_count INTEGER NOT NULL,
                funding_stage TEXT NOT NULL,
                tech_stack TEXT NOT NULL,
                annual_revenue_est TEXT NOT NULL,
                linkedin_url TEXT NOT NULL,
                enrichment_source TEXT NOT NULL,
                icp_score INTEGER NOT NULL,
                fit_tier TEXT NOT NULL,
                scoring_reasoning TEXT NOT NULL,
                buying_signals TEXT NOT NULL,
                personalized_subject TEXT NOT NULL,
                personalized_email_icebreaker TEXT NOT NULL,
                full_outreach_sequence_step1 TEXT NOT NULL,
                created_at TEXT NOT NULL,
                pipeline_trace TEXT NOT NULL DEFAULT '[]'
            );
        """)
        # Safe migration if table already existed without pipeline_trace
        try:
            await db.execute("ALTER TABLE gtm_leads ADD COLUMN pipeline_trace TEXT NOT NULL DEFAULT '[]';")
        except Exception:
            pass  # column already exists

        await db.execute("CREATE INDEX IF NOT EXISTS idx_leads_score ON gtm_leads (icp_score DESC);")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_leads_tier ON gtm_leads (fit_tier);")
        await db.commit()


async def count_leads() -> int:
    """Returns total number of leads currently stored in database."""
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM gtm_leads;") as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0


async def upsert_lead(lead: LeadRecord) -> LeadRecord:
    """Inserts or updates a lead in local SQLite and Supabase (if configured)."""
    # 1. Persist to local SQLite
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO gtm_leads (
                id, company_name, domain, contact_role, industry, employee_count,
                funding_stage, tech_stack, annual_revenue_est, linkedin_url,
                enrichment_source, icp_score, fit_tier, scoring_reasoning,
                buying_signals, personalized_subject, personalized_email_icebreaker,
                full_outreach_sequence_step1, created_at, pipeline_trace
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(domain) DO UPDATE SET
                company_name=excluded.company_name,
                contact_role=excluded.contact_role,
                industry=excluded.industry,
                employee_count=excluded.employee_count,
                funding_stage=excluded.funding_stage,
                tech_stack=excluded.tech_stack,
                annual_revenue_est=excluded.annual_revenue_est,
                linkedin_url=excluded.linkedin_url,
                enrichment_source=excluded.enrichment_source,
                icp_score=excluded.icp_score,
                fit_tier=excluded.fit_tier,
                scoring_reasoning=excluded.scoring_reasoning,
                buying_signals=excluded.buying_signals,
                personalized_subject=excluded.personalized_subject,
                personalized_email_icebreaker=excluded.personalized_email_icebreaker,
                full_outreach_sequence_step1=excluded.full_outreach_sequence_step1,
                created_at=excluded.created_at,
                pipeline_trace=excluded.pipeline_trace;
        """, (
            lead.id,
            lead.company_name,
            lead.domain,
            lead.contact_role,
            lead.industry,
            lead.employee_count,
            lead.funding_stage,
            json.dumps(lead.tech_stack),
            lead.annual_revenue_est,
            lead.linkedin_url,
            lead.enrichment_source,
            lead.icp_score,
            lead.fit_tier,
            lead.scoring_reasoning,
            json.dumps(lead.buying_signals),
            lead.personalized_subject,
            lead.personalized_email_icebreaker,
            lead.full_outreach_sequence_step1,
            lead.created_at,
            json.dumps([t.model_dump() for t in lead.pipeline_trace]),
        ))
        await db.commit()

    # 2. Attempt Supabase Upsert if configured
    supabase = get_supabase_client()
    if supabase:
        try:
            payload = lead.model_dump()
            supabase.table("gtm_leads").upsert(payload, on_conflict="domain").execute()
        except Exception as e:
            print(f"[Supabase Sync Error] Failed to sync {lead.domain} to Supabase: {e}")

    return lead


def _row_to_lead(row: sqlite3.Row) -> LeadRecord:
    """Helper to convert sqlite3 row to LeadRecord."""
    raw_trace = row["pipeline_trace"] if "pipeline_trace" in row.keys() else "[]"
    parsed_trace = json.loads(raw_trace) if isinstance(raw_trace, str) else (raw_trace or [])

    return LeadRecord(
        id=row["id"],
        company_name=row["company_name"],
        domain=row["domain"],
        contact_role=row["contact_role"],
        industry=row["industry"],
        employee_count=row["employee_count"],
        funding_stage=row["funding_stage"],
        tech_stack=json.loads(row["tech_stack"]) if isinstance(row["tech_stack"], str) else row["tech_stack"],
        annual_revenue_est=row["annual_revenue_est"],
        linkedin_url=row["linkedin_url"],
        enrichment_source=row["enrichment_source"],
        icp_score=row["icp_score"],
        fit_tier=row["fit_tier"],
        scoring_reasoning=row["scoring_reasoning"],
        buying_signals=json.loads(row["buying_signals"]) if isinstance(row["buying_signals"], str) else row["buying_signals"],
        personalized_subject=row["personalized_subject"],
        personalized_email_icebreaker=row["personalized_email_icebreaker"],
        full_outreach_sequence_step1=row["full_outreach_sequence_step1"],
        created_at=row["created_at"],
        pipeline_trace=[PipelineTraceStep.model_validate(t) for t in parsed_trace],
    )


async def get_leads(
    fit_tier: Optional[str] = None,
    min_score: Optional[int] = None,
    search: Optional[str] = None,
) -> List[LeadRecord]:
    """Retrieves sorted leads filtered by tier, min_score, or company/domain search."""
    await init_db()
    
    query = "SELECT * FROM gtm_leads WHERE 1=1"
    params: List[Any] = []

    if fit_tier and fit_tier.lower() != "all":
        query += " AND fit_tier = ?"
        params.append(fit_tier)

    if min_score is not None and min_score > 0:
        query += " AND icp_score >= ?"
        params.append(min_score)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query += " AND (LOWER(company_name) LIKE ? OR LOWER(domain) LIKE ?)"
        params.extend([term, term])

    query += " ORDER BY icp_score DESC, created_at DESC"

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [_row_to_lead(r) for r in rows]


async def get_telemetry() -> TelemetryMetrics:
    """Calculates live telemetry metrics from persisted database records."""
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT 
                COUNT(*) as total_leads,
                SUM(CASE WHEN fit_tier = 'Tier 1 - Hot' THEN 1 ELSE 0 END) as tier_1_count,
                AVG(icp_score) as avg_score
            FROM gtm_leads;
        """) as cursor:
            row = await cursor.fetchone()
            total = row["total_leads"] if row and row["total_leads"] else 0
            t1 = row["tier_1_count"] if row and row["tier_1_count"] else 0
            avg = round(float(row["avg_score"]), 1) if row and row["avg_score"] is not None else 0.0
            
            match_rate = round((t1 / total * 100), 1) if total > 0 else 0.0
            hours_saved = round(total * 0.25, 2)

            return TelemetryMetrics(
                total_leads=total,
                tier_1_count=t1,
                tier_1_match_rate=match_rate,
                avg_icp_score=avg,
                sdr_hours_saved=hours_saved,
            )


async def delete_all_leads():
    """Clears all leads from database."""
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM gtm_leads;")
        await db.commit()

    supabase = get_supabase_client()
    if supabase:
        try:
            supabase.table("gtm_leads").delete().neq("id", "0").execute()
        except Exception as e:
            print(f"[Supabase Delete Warning] {e}")
