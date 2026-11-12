import os
import json
import re
import asyncio
from typing import Optional, List, Tuple
from models import EnrichedCompany, GTMScoreResult

DEFAULT_ICP_CRITERIA = (
    "Target Series A to Series C B2B SaaS or FinTech companies with 20 to 300 employees "
    "using cloud infrastructure (AWS/GCP), Python, or modern data stacks who need "
    "AI workflow automation or GTM data pipelines."
)


def evaluate_algorithmic_icp(
    company: EnrichedCompany,
    contact_role: str,
    icp_criteria: str = DEFAULT_ICP_CRITERIA,
) -> GTMScoreResult:
    """
    Advanced Algorithmic ICP Scoring & Copywriting Engine.
    Executes a multi-factor weighted evaluation model when GEMINI_API_KEY is not set:
    
    1. Tech Stack Alignment (0–35 pts)
    2. Headcount Sweet Spot (0–25 pts)
    3. Funding & Growth Inflection (0–25 pts)
    4. Prompt Keyword Alignment (0–15 pts)
    
    Dynamically generates customized reasoning, buying signals, and hyper-targeted cold outreach.
    """
    # 1. Tech Stack Match (0 - 35 points)
    target_technologies = {
        "aws": 8,
        "gcp": 8,
        "python": 9,
        "fastapi": 7,
        "postgresql": 6,
        "snowflake": 7,
        "next.js": 5,
        "kubernetes": 6,
        "docker": 4,
        "typescript": 4,
        "kafka": 5,
        "clickhouse": 6,
    }
    
    company_stack_lower = [t.lower() for t in company.tech_stack]
    tech_score = 0
    matched_tech: List[str] = []
    
    for tech, pts in target_technologies.items():
        if any(tech in item for item in company_stack_lower):
            tech_score += pts
            # Find the original capitalization
            for original in company.tech_stack:
                if tech in original.lower() and original not in matched_tech:
                    matched_tech.append(original)
                    break
    
    tech_score = min(35, tech_score)

    # 2. Headcount Sweet Spot (0 - 25 points)
    # Target: 25 - 350 employees (high velocity, pre-enterprise bloat)
    emp = company.employee_count
    if 25 <= emp <= 350:
        headcount_score = 25
    elif 15 <= emp < 25:
        headcount_score = 18
    elif 350 < emp <= 700:
        headcount_score = 15
    elif 700 < emp <= 1500:
        headcount_score = 8
    else:  # > 1500 or < 15
        headcount_score = 4

    # 3. Funding & Growth Signal (0 - 25 points)
    stage = company.funding_stage.lower()
    if any(s in stage for s in ["series a", "series b", "series c"]):
        funding_score = 25
    elif "seed" in stage:
        funding_score = 16
    elif any(s in stage for s in ["series d", "series e"]):
        funding_score = 12
    elif any(s in stage for s in ["public", "late stage", "ipo"]):
        funding_score = 6
    else:
        funding_score = 10

    # 4. Criteria Keyword Alignment (0 - 15 points)
    criteria_tokens = [w.lower() for w in re.findall(r"\b\w+\b", icp_criteria) if len(w) > 3]
    searchable_lead_text = f"{company.industry} {' '.join(company.tech_stack)} {company.funding_stage}".lower()
    
    keyword_matches = sum(1 for token in set(criteria_tokens) if token in searchable_lead_text)
    keyword_score = min(15, keyword_matches * 3)

    # Total weighted score
    raw_score = tech_score + headcount_score + funding_score + keyword_score
    icp_score = max(20, min(99, raw_score))

    # Determine fit tier
    if icp_score >= 80:
        fit_tier = "Tier 1 - Hot"
    elif icp_score >= 50:
        fit_tier = "Tier 2 - Warm"
    else:
        fit_tier = "Tier 3 - Disqualified"

    # Select top 2 technologies for copy injection
    top_tech = matched_tech[:2] if matched_tech else (company.tech_stack[:2] if company.tech_stack else ["Cloud Infrastructure", "PostgreSQL"])
    tech_str = " and ".join(top_tech)
    primary_tech = top_tech[0] if top_tech else "Modern Cloud"

    # Programmatic Dynamic Reasoning
    if fit_tier == "Tier 1 - Hot":
        scoring_reasoning = (
            f"Scored {icp_score}/100 ({fit_tier}): {company.company_name} is an optimal target at {company.funding_stage} stage with {company.employee_count} employees in {company.industry}. "
            f"Their tech stack featuring {', '.join(company.tech_stack[:3])} directly matches the requirements for automated GTM pipelines."
        )
    elif fit_tier == "Tier 2 - Warm":
        scoring_reasoning = (
            f"Scored {icp_score}/100 ({fit_tier}): {company.company_name} demonstrates solid technographic alignment using {tech_str}, but company scale ({company.employee_count} employees) or funding profile ({company.funding_stage}) places them in a secondary evaluation tier."
        )
    else:
        scoring_reasoning = (
            f"Scored {icp_score}/100 ({fit_tier}): {company.company_name} falls outside target profile bounds due to company scale ({company.employee_count} employees) or stage ({company.funding_stage}), showing lower fit for high-velocity outbound automation."
        )

    # Programmatic Buying Signals
    buying_signals = [
        f"Active deployment of {tech_str} signaling high engineering velocity",
        f"{company.funding_stage} growth inflection with {company.employee_count} headcount",
        f"Target persona '{contact_role}' possesses direct budget and infrastructure authority",
    ]
    if company.annual_revenue_est and company.annual_revenue_est != "$0M":
        buying_signals.append(f"Estimated revenue scale of {company.annual_revenue_est} ARR")

    # Dynamic Outbound Sequence Generation
    personalized_subject = f"{company.company_name}'s {primary_tech} stack + GTM pipeline velocity"

    personalized_email_icebreaker = (
        f"Noticed {company.company_name}'s recent momentum at the {company.funding_stage} stage, particularly how your team is scaling your {tech_str} architecture. "
        f"With around {company.employee_count} people, bridging the gap between product event data and outbound revenue operations usually becomes a key bottleneck."
    )

    full_email = f"""Subject: {personalized_subject}

Hi {company.company_name} team,

{personalized_email_icebreaker}

We engineered an automated GTM data pipeline specifically for high-velocity teams building on {tech_str}. The engine enriches incoming target domains, calculates strict ICP alignment with Gemini structured outputs, and generates tailored outbound hooks in seconds—saving 15+ research hours per week per SDR.

Given your leadership focus as {contact_role}, would you be open to a 7-minute look at how engineering-driven teams at the {company.funding_stage} stage are automating their outbound qualification?

Best regards,
GTM Engineering Team
"""

    return GTMScoreResult(
        icp_score=icp_score,
        fit_tier=fit_tier,
        scoring_reasoning=scoring_reasoning,
        buying_signals=buying_signals,
        personalized_subject=personalized_subject,
        personalized_email_icebreaker=personalized_email_icebreaker,
        full_outreach_sequence_step1=full_email.strip(),
    )


async def score_lead_with_gemini(
    company: EnrichedCompany,
    contact_role: str = "VP of Engineering",
    icp_criteria: Optional[str] = None,
) -> GTMScoreResult:
    """
    Evaluates an enriched lead against ICP criteria and writes hyper-personalized cold outreach.
    
    1. If GEMINI_API_KEY is present: calls Google Gemini via the official google-genai SDK
       with structured outputs (response_schema=GTMScoreResult).
    2. If GEMINI_API_KEY is unset (Zero-Key Mode): executes the deterministic
       algorithmic scoring model with simulated async latency.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    active_criteria = (icp_criteria or "").strip() or DEFAULT_ICP_CRITERIA

    # Zero-Key Mode (Default)
    if not gemini_key:
        # Simulate LLM inference latency
        await asyncio.sleep(0.08)
        return evaluate_algorithmic_icp(company, contact_role, active_criteria)

    # Live Production Mode (when GEMINI_API_KEY is provided)
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=gemini_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

        prompt = f"""
You are an expert B2B Go-To-Market (GTM) Engineer and RevOps Strategist.
Evaluate the following enriched company against the defined Ideal Customer Profile (ICP) criteria and generate hyper-personalized outbound email copy.

=== TARGET ICP CRITERIA ===
{active_criteria}

=== ENRICHED COMPANY PROFILE ===
Company Name: {company.company_name}
Domain: {company.domain}
Target Contact Role: {contact_role}
Industry: {company.industry}
Employee Count: {company.employee_count}
Funding Stage: {company.funding_stage}
Tech Stack: {', '.join(company.tech_stack)}
Estimated Annual Revenue: {company.annual_revenue_est}
LinkedIn: {company.linkedin_url}

=== INSTRUCTIONS ===
1. icp_score: Evaluate strict fit between 0 and 100 based on the ICP criteria.
2. fit_tier:
   - "Tier 1 - Hot" for scores 80-100
   - "Tier 2 - Warm" for scores 50-79
   - "Tier 3 - Disqualified" for scores < 50
3. scoring_reasoning: Provide EXACTLY TWO concise sentences explaining why this company matches or fails the ICP.
4. buying_signals: Extract 2-4 concrete signals (e.g., tech stack markers, headcount milestone, growth velocity).
5. personalized_subject: Craft a high-open-rate cold email subject line tailored to their tech stack or stage.
6. personalized_email_icebreaker: Provide a 2-sentence hyper-specific cold outreach hook referencing their exact tech stack and scale.
7. full_outreach_sequence_step1: Write the complete high-converting cold email body (Subject, Icebreaker hook, Value proposition, and soft CTA).
"""

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GTMScoreResult,
                temperature=0.2,
            ),
        )

        raw_text = response.text
        if raw_text:
            parsed_json = json.loads(raw_text)
            return GTMScoreResult.model_validate(parsed_json)

        print("[Gemini Scorer] Empty response from Gemini API. Falling back to algorithmic engine.")
        return evaluate_algorithmic_icp(company, contact_role, active_criteria)

    except Exception as e:
        print(f"[Gemini Scorer Exception] {e}. Falling back to algorithmic engine.")
        return evaluate_algorithmic_icp(company, contact_role, active_criteria)
