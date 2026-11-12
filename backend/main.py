import os
import csv
import io
import time
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")

from models import (
    RawLead,
    EnrichedCompany,
    GTMScoreResult,
    LeadRecord,
    PipelineTraceStep,
    EnrichSingleRequest,
    TelemetryMetrics,
)
from services.apollo import enrich_domain
from services.gemini_scorer import score_lead_with_gemini, DEFAULT_ICP_CRITERIA
from services.database import (
    init_db,
    count_leads,
    upsert_lead,
    get_leads,
    get_telemetry,
    delete_all_leads,
)

app = FastAPI(
    title="GTM Lead Enrichment & ICP Scoring Engine",
    description="High-velocity B2B RevOps pipeline with Zero-Key Deterministic Mode by default",
    version="1.1.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initializes database and auto-seeds benchmark leads if database is empty."""
    await init_db()
    existing_count = await count_leads()
    if existing_count == 0:
        print("[GTM Startup] Database empty. Auto-seeding 10 benchmark leads from sample_leads.csv...")
        try:
            await run_sample_pipeline()
            print("[GTM Startup] Successfully auto-seeded 10 benchmark leads.")
        except Exception as e:
            print(f"[GTM Startup Warning] Could not auto-seed leads on boot: {e}")


async def process_single_lead_pipeline(
    raw: RawLead,
    icp_criteria: Optional[str] = None,
) -> LeadRecord:
    """
    Executes the end-to-end GTM pipeline with execution trace:
    [STEP 1: INGEST] -> [STEP 2: ENRICH] -> [STEP 3: ICP_SCORE] -> [STEP 4: SEQUENCE_GEN] -> [STEP 5: SYNC]
    """
    trace: List[PipelineTraceStep] = []
    t_start = time.perf_counter()

    # STEP 1: INGEST
    t1_start = time.perf_counter()
    clean_domain = raw.domain.strip().lower()
    contact_role = raw.contact_role or "VP of Engineering"
    t1_latency = f"{max(0.01, time.perf_counter() - t1_start):.2f}s"
    trace.append(
        PipelineTraceStep(
            step="STEP 1: INGEST",
            name="Payload Validation & Ingestion",
            status="completed",
            latency=t1_latency,
            summary=f"Parsed domain '{clean_domain}' & target persona '{contact_role}'",
            details={"raw_domain": raw.domain, "contact_role": contact_role},
        )
    )

    # STEP 2: ENRICH
    t2_start = time.perf_counter()
    enriched = await enrich_domain(clean_domain, raw.company_name)
    t2_latency = f"{max(0.01, time.perf_counter() - t2_start):.2f}s"
    trace.append(
        PipelineTraceStep(
            step="STEP 2: ENRICH",
            name="Firmographic & Technographic Enrichment",
            status="completed",
            latency=t2_latency,
            summary=f"Extracted {len(enriched.tech_stack)} tech stack signals & {enriched.employee_count} headcount ({enriched.funding_stage}) via {enriched.enrichment_source}",
            details={
                "source": enriched.enrichment_source,
                "headcount": enriched.employee_count,
                "funding": enriched.funding_stage,
                "tech_count": len(enriched.tech_stack),
            },
        )
    )

    # STEP 3: ICP_SCORE
    t3_start = time.perf_counter()
    score_res = await score_lead_with_gemini(
        company=enriched,
        contact_role=contact_role,
        icp_criteria=icp_criteria,
    )
    t3_latency = f"{max(0.01, time.perf_counter() - t3_start):.2f}s"
    trace.append(
        PipelineTraceStep(
            step="STEP 3: ICP_SCORE",
            name="Algorithmic Fit Evaluation",
            status="completed",
            latency=t3_latency,
            summary=f"Computed weighted fit score: {score_res.icp_score}/100 -> {score_res.fit_tier}",
            details={
                "icp_score": score_res.icp_score,
                "fit_tier": score_res.fit_tier,
                "signals_count": len(score_res.buying_signals),
            },
        )
    )

    # STEP 4: SEQUENCE_GEN
    t4_start = time.perf_counter()
    # (Email sequence synthesized during scoring step)
    t4_latency = f"{max(0.01, time.perf_counter() - t4_start):.2f}s"
    trace.append(
        PipelineTraceStep(
            step="STEP 4: SEQUENCE_GEN",
            name="Hyper-Personalized Copywriting",
            status="completed",
            latency=t4_latency,
            summary=f"Synthesized personalized outbound hook & Step 1 sequence citing {', '.join(enriched.tech_stack[:2])}",
            details={"subject_line": score_res.personalized_subject},
        )
    )

    # Assemble unified LeadRecord
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    record = LeadRecord(
        id=lead_id,
        company_name=enriched.company_name,
        domain=enriched.domain,
        contact_role=contact_role,
        industry=enriched.industry,
        employee_count=enriched.employee_count,
        funding_stage=enriched.funding_stage,
        tech_stack=enriched.tech_stack,
        annual_revenue_est=enriched.annual_revenue_est,
        linkedin_url=enriched.linkedin_url,
        enrichment_source=enriched.enrichment_source,
        icp_score=score_res.icp_score,
        fit_tier=score_res.fit_tier,
        scoring_reasoning=score_res.scoring_reasoning,
        buying_signals=score_res.buying_signals,
        personalized_subject=score_res.personalized_subject,
        personalized_email_icebreaker=score_res.personalized_email_icebreaker,
        full_outreach_sequence_step1=score_res.full_outreach_sequence_step1,
        created_at=created_at,
        pipeline_trace=trace,
    )

    # STEP 5: SYNC
    t5_start = time.perf_counter()
    saved = await upsert_lead(record)
    t5_latency = f"{max(0.01, time.perf_counter() - t5_start):.2f}s"
    saved.pipeline_trace.append(
        PipelineTraceStep(
            step="STEP 5: SYNC",
            name="Dual Store Persistence",
            status="completed",
            latency=t5_latency,
            summary="Upserted record into local SQLite / Supabase database store",
            details={"lead_id": lead_id},
        )
    )

    return saved


@app.get("/api/health")
async def health_check():
    has_apollo = bool(os.getenv("APOLLO_API_KEY", "").strip())
    has_gemini = bool(os.getenv("GEMINI_API_KEY", "").strip())
    has_supabase = bool(os.getenv("SUPABASE_URL", "").strip() and (os.getenv("SUPABASE_SERVICE_KEY", "").strip() or os.getenv("SUPABASE_KEY", "").strip()))

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "providers": {
            "apollo_enrichment": "live_api" if has_apollo else "deterministic_mock_engine",
            "gemini_scorer": "google_genai_live" if has_gemini else "local_heuristic_engine",
            "database": "supabase_postgresql" if has_supabase else "local_sqlite_engine",
        },
    }


@app.get("/api/telemetry", response_model=TelemetryMetrics)
async def fetch_telemetry():
    """Returns top telemetry KPIs for the command center ribbon."""
    return await get_telemetry()


@app.get("/api/leads", response_model=List[LeadRecord])
async def list_leads(
    fit_tier: Optional[str] = Query(None, description="Filter by fit tier"),
    min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum ICP score"),
    search: Optional[str] = Query(None, description="Search company name or domain"),
):
    """Returns sorted leads from the database with optional filtering."""
    return await get_leads(fit_tier=fit_tier, min_score=min_score, search=search)


@app.post("/api/leads/enrich-single", response_model=LeadRecord)
async def enrich_single_lead(req: EnrichSingleRequest):
    """Runs a single company domain live through Apollo -> Gemini -> Database."""
    if not req.domain or not req.domain.strip():
        raise HTTPException(status_code=400, detail="Domain cannot be empty.")

    raw = RawLead(
        company_name=req.company_name or "",
        domain=req.domain.strip(),
        contact_role=req.contact_role or "VP of Engineering",
    )
    result = await process_single_lead_pipeline(raw, req.icp_criteria)
    return result


@app.post("/api/leads/upload-csv", response_model=List[LeadRecord])
async def upload_csv(
    file: UploadFile = File(...),
    icp_criteria: Optional[str] = Form(None),
):
    """
    Accepts a CSV with columns (company_name,domain,contact_role) and processes
    leads asynchronously with a concurrency semaphore of 5.
    """
    contents = await file.read()
    decoded = contents.decode("utf-8-sig")  # handles BOM
    reader = csv.DictReader(io.StringIO(decoded))

    raw_leads: List[RawLead] = []
    for row in reader:
        norm_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}
        domain = norm_row.get("domain") or norm_row.get("website") or norm_row.get("company_domain")
        company_name = norm_row.get("company_name") or norm_row.get("company") or norm_row.get("name") or ""
        contact_role = norm_row.get("contact_role") or norm_row.get("role") or norm_row.get("title") or "VP of Engineering"

        if domain:
            raw_leads.append(RawLead(company_name=company_name, domain=domain, contact_role=contact_role))

    if not raw_leads:
        raise HTTPException(status_code=400, detail="No valid domains found in uploaded CSV file.")

    semaphore = asyncio.Semaphore(5)

    async def sem_process(lead: RawLead):
        async with semaphore:
            return await process_single_lead_pipeline(lead, icp_criteria)

    results = await asyncio.gather(*(sem_process(lead) for lead in raw_leads))
    return results


@app.post("/api/leads/run-sample", response_model=List[LeadRecord])
async def run_sample_pipeline(icp_criteria: Optional[str] = None):
    """
    Instant demo trigger: Ingests backend/sample_leads.csv and runs all 10 leads
    through the enrichment & scoring pipeline with concurrency control.
    """
    sample_file = Path(__file__).parent / "sample_leads.csv"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="sample_leads.csv not found.")

    with open(sample_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        raw_leads = [
            RawLead(
                company_name=row.get("company_name", ""),
                domain=row.get("domain", ""),
                contact_role=row.get("contact_role", "VP of Engineering"),
            )
            for row in reader
            if row.get("domain")
        ]

    semaphore = asyncio.Semaphore(5)

    async def sem_process(lead: RawLead):
        async with semaphore:
            return await process_single_lead_pipeline(lead, icp_criteria)

    results = await asyncio.gather(*(sem_process(lead) for lead in raw_leads))
    return results


@app.get("/api/leads/export-csv")
async def export_leads_csv():
    """
    Exports enriched table + generated email copy as a clean CSV formatted for
    direct Smartlead, Instantly, or HubSpot upload.
    """
    leads = await get_leads()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Company Name",
        "Domain",
        "Target Contact Role",
        "ICP Score",
        "Fit Tier",
        "Personalized Subject",
        "Personalized Icebreaker",
        "Full Email Step 1",
        "Industry",
        "Employee Count",
        "Funding Stage",
        "Tech Stack",
        "Annual Revenue",
        "LinkedIn URL",
        "Scoring Reasoning",
        "Buying Signals",
        "Enrichment Source",
    ])

    for lead in leads:
        writer.writerow([
            lead.company_name,
            lead.domain,
            lead.contact_role,
            lead.icp_score,
            lead.fit_tier,
            lead.personalized_subject,
            lead.personalized_email_icebreaker,
            lead.full_outreach_sequence_step1,
            lead.industry,
            lead.employee_count,
            lead.funding_stage,
            "; ".join(lead.tech_stack),
            lead.annual_revenue_est,
            lead.linkedin_url,
            lead.scoring_reasoning,
            "; ".join(lead.buying_signals),
            lead.enrichment_source,
        ])

    output.seek(0)
    filename = f"gtm_leads_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.delete("/api/leads/reset")
async def reset_leads():
    """Clears all leads from the database and re-seeds the 10 demo leads."""
    await delete_all_leads()
    seeded = await run_sample_pipeline()
    return {"message": "Database reset and successfully re-seeded with 10 demo leads.", "count": len(seeded)}
