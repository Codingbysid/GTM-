import os
import re
import asyncio
import hashlib
from typing import Dict, Any, List
import httpx
from models import EnrichedCompany

# Pre-seeded high-fidelity firmographic profiles for benchmark tech companies
KNOWN_B2B_PROFILES: Dict[str, Dict[str, Any]] = {
    "linear.app": {
        "company_name": "Linear",
        "industry": "Project Management & Developer Tools",
        "employee_count": 75,
        "funding_stage": "Series B",
        "tech_stack": ["AWS", "TypeScript", "React", "Node.js", "PostgreSQL", "Next.js", "GraphQL", "Tailwind CSS"],
        "annual_revenue_est": "$35M",
        "linkedin_url": "https://www.linkedin.com/company/linear-app",
    },
    "supabase.com": {
        "company_name": "Supabase",
        "industry": "Developer Tools & Open-Source Database",
        "employee_count": 140,
        "funding_stage": "Series B",
        "tech_stack": ["AWS", "GCP", "PostgreSQL", "Elixir", "Go", "TypeScript", "Next.js", "Docker"],
        "annual_revenue_est": "$28M",
        "linkedin_url": "https://www.linkedin.com/company/supabase",
    },
    "retool.com": {
        "company_name": "Retool",
        "industry": "Internal Tools & Low-Code Platform",
        "employee_count": 320,
        "funding_stage": "Series C",
        "tech_stack": ["AWS", "Node.js", "TypeScript", "React", "PostgreSQL", "Kubernetes", "Docker", "Datadog"],
        "annual_revenue_est": "$95M",
        "linkedin_url": "https://www.linkedin.com/company/retool-inc",
    },
    "vercel.com": {
        "company_name": "Vercel",
        "industry": "Cloud Infrastructure & Frontend Cloud",
        "employee_count": 550,
        "funding_stage": "Series E",
        "tech_stack": ["AWS", "GCP", "Next.js", "TypeScript", "Rust", "Turborepo", "Tailwind CSS", "PostgreSQL"],
        "annual_revenue_est": "$120M",
        "linkedin_url": "https://www.linkedin.com/company/vercel",
    },
    "posthog.com": {
        "company_name": "PostHog",
        "industry": "Product Analytics & Developer Platform",
        "employee_count": 110,
        "funding_stage": "Series B",
        "tech_stack": ["AWS", "Python", "Django", "ClickHouse", "PostgreSQL", "Kafka", "TypeScript", "React"],
        "annual_revenue_est": "$22M",
        "linkedin_url": "https://www.linkedin.com/company/posthog",
    },
    "modal.com": {
        "company_name": "Modal",
        "industry": "Serverless AI & Cloud Compute Infrastructure",
        "employee_count": 45,
        "funding_stage": "Series A",
        "tech_stack": ["AWS", "GCP", "Python", "Rust", "FastAPI", "Docker", "Linux Containers", "PyTorch"],
        "annual_revenue_est": "$15M",
        "linkedin_url": "https://www.linkedin.com/company/modal-labs",
    },
    "langchain.com": {
        "company_name": "LangChain",
        "industry": "AI Frameworks & LLM Application Tooling",
        "employee_count": 65,
        "funding_stage": "Series A",
        "tech_stack": ["AWS", "GCP", "Python", "TypeScript", "FastAPI", "Next.js", "PostgreSQL", "LangSmith"],
        "annual_revenue_est": "$18M",
        "linkedin_url": "https://www.linkedin.com/company/langchain",
    },
    "scale.com": {
        "company_name": "Scale AI",
        "industry": "AI Data Infrastructure & Foundation Models",
        "employee_count": 950,
        "funding_stage": "Series F",
        "tech_stack": ["AWS", "GCP", "Python", "React", "TypeScript", "Kubernetes", "Snowflake", "PyTorch"],
        "annual_revenue_est": "$750M",
        "linkedin_url": "https://www.linkedin.com/company/scaleai",
    },
    "deel.com": {
        "company_name": "Deel",
        "industry": "Global Payroll & HR FinTech",
        "employee_count": 3100,
        "funding_stage": "Series D",
        "tech_stack": ["AWS", "Node.js", "TypeScript", "React", "PostgreSQL", "Segment", "Snowflake", "Datadog"],
        "annual_revenue_est": "$500M",
        "linkedin_url": "https://www.linkedin.com/company/deel",
    },
    "stripe.com": {
        "company_name": "Stripe",
        "industry": "Financial Technology & Developer Infrastructure",
        "employee_count": 8200,
        "funding_stage": "Late Stage / Pre-IPO",
        "tech_stack": ["AWS", "Ruby", "TypeScript", "React", "Kafka", "PostgreSQL", "Kubernetes", "Redis"],
        "annual_revenue_est": "$14.3B",
        "linkedin_url": "https://www.linkedin.com/company/stripe",
    },
}

SAMPLE_TECH_POOLS: List[List[str]] = [
    ["AWS", "Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
    ["AWS", "GCP", "Next.js", "TypeScript", "Tailwind CSS", "Snowflake"],
    ["GCP", "Python", "Kubernetes", "Kafka", "PostgreSQL", "PyTorch"],
    ["AWS", "Node.js", "React", "PostgreSQL", "Segment", "Datadog"],
    ["AWS", "GCP", "Python", "ClickHouse", "FastAPI", "Docker"],
    ["AWS", "TypeScript", "Next.js", "PostgreSQL", "GraphQL", "Redis"],
]

SAMPLE_INDUSTRIES: List[str] = [
    "B2B SaaS / Workflow Automation",
    "Developer Tooling & Cloud Infrastructure",
    "FinTech & Billing Infrastructure",
    "AI Agents & Data Pipeline Infrastructure",
    "Productivity & Revenue Operations",
    "Cybersecurity & Identity Governance",
]

SAMPLE_FUNDING_STAGES: List[str] = ["Seed", "Series A", "Series B", "Series C"]


def normalize_domain(domain: str) -> str:
    """Cleans domain strings into canonical hostname."""
    domain = domain.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    domain = domain.split("/")[0].split("?")[0]
    return domain


def generate_deterministic_mock(domain: str, company_name: str) -> EnrichedCompany:
    """
    Generates realistic B2B SaaS firmographics deterministically based on domain hash.
    Ensures identical domains always return stable, reproducible data for portfolio reviews.
    """
    clean_domain = normalize_domain(domain)
    
    # 1. Exact or partial match on known benchmark tech companies
    if clean_domain in KNOWN_B2B_PROFILES:
        preset = KNOWN_B2B_PROFILES[clean_domain]
        return EnrichedCompany(
            company_name=company_name or preset["company_name"],
            domain=clean_domain,
            industry=preset["industry"],
            employee_count=preset["employee_count"],
            funding_stage=preset["funding_stage"],
            tech_stack=preset["tech_stack"],
            annual_revenue_est=preset["annual_revenue_est"],
            linkedin_url=preset["linkedin_url"],
            enrichment_source="mock_engine",
        )

    # 2. Hash-based deterministic generator for arbitrary user-entered domains
    h = int(hashlib.md5(clean_domain.encode("utf-8")).hexdigest(), 16)
    
    inferred_name = company_name.strip() if company_name else clean_domain.split(".")[0].capitalize()
    industry = SAMPLE_INDUSTRIES[h % len(SAMPLE_INDUSTRIES)]
    funding_stage = SAMPLE_FUNDING_STAGES[h % len(SAMPLE_FUNDING_STAGES)]
    tech_stack = SAMPLE_TECH_POOLS[h % len(SAMPLE_TECH_POOLS)]
    
    employee_ranges = {
        "Seed": (12, 28),
        "Series A": (32, 88),
        "Series B": (95, 260),
        "Series C": (270, 480),
    }
    low, high = employee_ranges.get(funding_stage, (30, 220))
    employee_count = low + (h % (high - low + 1))
    
    rev_arr = round((employee_count * 185_000) / 1_000_000, 1)
    annual_revenue_est = f"${rev_arr}M"
    linkedin_url = f"https://www.linkedin.com/company/{clean_domain.split('.')[0]}"

    return EnrichedCompany(
        company_name=inferred_name,
        domain=clean_domain,
        industry=industry,
        employee_count=employee_count,
        funding_stage=funding_stage,
        tech_stack=tech_stack,
        annual_revenue_est=annual_revenue_est,
        linkedin_url=linkedin_url,
        enrichment_source="mock_engine",
    )


async def enrich_domain(domain: str, company_name: str = "") -> EnrichedCompany:
    """
    Firmographic enrichment pipeline.
    
    1. If APOLLO_API_KEY is present: calls Apollo REST API via httpx.AsyncClient.
    2. If APOLLO_API_KEY is absent/unset: executes deterministic Local Enrichment Engine
       with simulated async network delay to reflect real-world pipeline dynamics.
    """
    clean_domain = normalize_domain(domain)
    apollo_api_key = os.getenv("APOLLO_API_KEY", "").strip()

    # Zero-Key Mode (Default)
    if not apollo_api_key:
        # Simulate realistic async network roundtrip for frontend progress feedback
        await asyncio.sleep(0.25)
        return generate_deterministic_mock(clean_domain, company_name)

    # Live Production Mode (when APOLLO_API_KEY is provided)
    try:
        url = f"https://api.apollo.io/v1/organizations/enrich?domain={clean_domain}"
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": apollo_api_key,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                org = data.get("organization")
                if org:
                    tech_list: List[str] = []
                    raw_tech = org.get("current_technologies") or []
                    for t in raw_tech:
                        if isinstance(t, dict) and "name" in t:
                            tech_list.append(t["name"])
                        elif isinstance(t, str):
                            tech_list.append(t)
                    
                    if not tech_list:
                        tech_list = ["AWS", "PostgreSQL", "Python", "TypeScript"]

                    emp_count = org.get("estimated_num_employees") or 75
                    funding_stage = org.get("latest_funding_stage") or "Series A"
                    rev_est = org.get("annual_revenue_printed") or f"${round(emp_count * 0.18, 1)}M"

                    return EnrichedCompany(
                        company_name=org.get("name") or company_name or clean_domain.split(".")[0].capitalize(),
                        domain=clean_domain,
                        industry=org.get("industry") or "B2B Software",
                        employee_count=int(emp_count),
                        funding_stage=str(funding_stage),
                        tech_stack=tech_list[:8],
                        annual_revenue_est=str(rev_est),
                        linkedin_url=org.get("linkedin_url") or f"https://www.linkedin.com/company/{clean_domain.split('.')[0]}",
                        enrichment_source="apollo_live",
                    )
            
            print(f"[Apollo API] Response status {resp.status_code} for {clean_domain}. Falling back to deterministic engine.")
            await asyncio.sleep(0.25)
            return generate_deterministic_mock(clean_domain, company_name)
    except Exception as e:
        print(f"[Apollo API Exception] {e}. Falling back to deterministic engine.")
        await asyncio.sleep(0.25)
        return generate_deterministic_mock(clean_domain, company_name)
