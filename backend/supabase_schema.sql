-- GTM Leads Schema for Supabase PostgreSQL
CREATE TABLE IF NOT EXISTS gtm_leads (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    contact_role TEXT NOT NULL DEFAULT 'VP of Engineering',
    industry TEXT NOT NULL,
    employee_count INTEGER NOT NULL,
    funding_stage TEXT NOT NULL,
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    annual_revenue_est TEXT NOT NULL,
    linkedin_url TEXT NOT NULL,
    enrichment_source TEXT NOT NULL CHECK (enrichment_source IN ('apollo_live', 'mock_engine')),
    icp_score INTEGER NOT NULL CHECK (icp_score >= 0 AND icp_score <= 100),
    fit_tier TEXT NOT NULL CHECK (fit_tier IN ('Tier 1 - Hot', 'Tier 2 - Warm', 'Tier 3 - Disqualified')),
    scoring_reasoning TEXT NOT NULL,
    buying_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    personalized_subject TEXT NOT NULL,
    personalized_email_icebreaker TEXT NOT NULL,
    full_outreach_sequence_step1 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for high-speed RevOps querying
CREATE INDEX IF NOT EXISTS idx_gtm_leads_icp_score ON gtm_leads (icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_gtm_leads_fit_tier ON gtm_leads (fit_tier);
CREATE INDEX IF NOT EXISTS idx_gtm_leads_domain ON gtm_leads (domain);
CREATE INDEX IF NOT EXISTS idx_gtm_leads_created_at ON gtm_leads (created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE gtm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to gtm_leads"
    ON gtm_leads FOR SELECT
    USING (true);

CREATE POLICY "Allow service role full access to gtm_leads"
    ON gtm_leads FOR ALL
    USING (true)
    WITH CHECK (true);
