export type FitTierType = "Tier 1 - Hot" | "Tier 2 - Warm" | "Tier 3 - Disqualified";
export type EnrichmentSourceType = "apollo_live" | "mock_engine";

export interface PipelineTraceStep {
  step: string;
  name: string;
  status: string;
  latency: string;
  summary: string;
  details?: Record<string, unknown>;
}

export interface LeadRecord {
  id: string;
  company_name: string;
  domain: string;
  contact_role: string;
  industry: string;
  employee_count: number;
  funding_stage: string;
  tech_stack: string[];
  annual_revenue_est: string;
  linkedin_url: string;
  enrichment_source: EnrichmentSourceType;
  icp_score: number;
  fit_tier: FitTierType;
  scoring_reasoning: string;
  buying_signals: string[];
  personalized_subject: string;
  personalized_email_icebreaker: string;
  full_outreach_sequence_step1: string;
  created_at: string;
  pipeline_trace?: PipelineTraceStep[];
}

export interface TelemetryMetrics {
  total_leads: number;
  tier_1_count: number;
  tier_1_match_rate: number;
  avg_icp_score: number;
  sdr_hours_saved: number;
}

export interface EnrichSinglePayload {
  domain: string;
  company_name?: string;
  contact_role?: string;
  icp_criteria?: string;
}
