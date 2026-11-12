from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

FitTierType = Literal["Tier 1 - Hot", "Tier 2 - Warm", "Tier 3 - Disqualified"]
EnrichmentSourceType = Literal["apollo_live", "mock_engine"]

class RawLead(BaseModel):
    company_name: str
    domain: str
    contact_role: Optional[str] = "VP of Engineering"

class EnrichedCompany(BaseModel):
    company_name: str
    domain: str
    industry: str
    employee_count: int
    funding_stage: str
    tech_stack: List[str]
    annual_revenue_est: str
    linkedin_url: str
    enrichment_source: EnrichmentSourceType

class GTMScoreResult(BaseModel):
    icp_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Fit score from 0 to 100 based on company match against ICP criteria."
    )
    fit_tier: FitTierType = Field(
        ...,
        description="Categorical tier: Tier 1 - Hot (80-100), Tier 2 - Warm (50-79), Tier 3 - Disqualified (<50)."
    )
    scoring_reasoning: str = Field(
        ...,
        description="Two concise sentences explaining why the company matches or fails the ICP."
    )
    buying_signals: List[str] = Field(
        default_factory=list,
        description="List of detected buying signals (e.g. rapid headcount growth, tech stack migrations, funding)."
    )
    personalized_subject: str = Field(
        ...,
        description="Compelling, punchy cold email subject line tailored to the company's stack or stage."
    )
    personalized_email_icebreaker: str = Field(
        ...,
        description="Two-sentence hyper-specific cold outreach hook referencing their tech stack and scale."
    )
    full_outreach_sequence_step1: str = Field(
        ...,
        description="Complete cold outreach email (subject, personalized icebreaker, value proposition, soft CTA)."
    )

class PipelineTraceStep(BaseModel):
    step: str
    name: str
    status: str = "completed"
    latency: str
    summary: str
    details: Optional[Dict[str, Any]] = None

class LeadRecord(BaseModel):
    id: str
    company_name: str
    domain: str
    contact_role: str
    industry: str
    employee_count: int
    funding_stage: str
    tech_stack: List[str]
    annual_revenue_est: str
    linkedin_url: str
    enrichment_source: EnrichmentSourceType
    icp_score: int
    fit_tier: FitTierType
    scoring_reasoning: str
    buying_signals: List[str]
    personalized_subject: str
    personalized_email_icebreaker: str
    full_outreach_sequence_step1: str
    created_at: str
    pipeline_trace: List[PipelineTraceStep] = Field(default_factory=list)

class EnrichSingleRequest(BaseModel):
    domain: str
    company_name: Optional[str] = None
    contact_role: Optional[str] = "VP of Engineering"
    icp_criteria: Optional[str] = None

class TelemetryMetrics(BaseModel):
    total_leads: int
    tier_1_count: int
    tier_1_match_rate: float
    avg_icp_score: float
    sdr_hours_saved: float
