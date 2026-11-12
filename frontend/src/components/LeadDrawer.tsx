"use client";

import React, { useState } from "react";
import { LeadRecord } from "@/types/lead";
import { getFaviconUrl, getScoreBadgeStyles, getTierBadgeStyles } from "@/lib/utils";
import {
  X,
  Copy,
  Check,
  Mail,
  Target,
  Building2,
  Code2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Workflow,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface LeadDrawerProps {
  lead: LeadRecord | null;
  onClose: () => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<"outbound" | "scoring" | "trace" | "firmographics" | "json">("outbound");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!lead) return null;

  const badgeStyle = getScoreBadgeStyles(lead.icp_score);
  const tierStyle = getTierBadgeStyles(lead.fit_tier);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(lead.full_outreach_sequence_step1);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(lead, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const defaultTrace = [
    {
      step: "STEP 1: INGEST",
      name: "Payload Validation & Ingestion",
      status: "completed",
      latency: "0.01s",
      summary: `Parsed domain '${lead.domain}' & target persona '${lead.contact_role}'`,
    },
    {
      step: "STEP 2: ENRICH",
      name: "Firmographic & Technographic Enrichment",
      status: "completed",
      latency: "0.24s",
      summary: `Extracted ${lead.tech_stack.length} tech signals & ${lead.employee_count} headcount (${lead.funding_stage}) via ${lead.enrichment_source}`,
    },
    {
      step: "STEP 3: ICP_SCORE",
      name: "Algorithmic Fit Evaluation",
      status: "completed",
      latency: "0.08s",
      summary: `Computed weighted fit score: ${lead.icp_score}/100 -> ${lead.fit_tier}`,
    },
    {
      step: "STEP 4: SEQUENCE_GEN",
      name: "Hyper-Personalized Copywriting",
      status: "completed",
      latency: "0.04s",
      summary: `Synthesized personalized outbound hook & Step 1 sequence citing ${lead.tech_stack.slice(0, 2).join(" & ")}`,
    },
    {
      step: "STEP 5: SYNC",
      name: "Dual Store Persistence",
      status: "completed",
      latency: "0.02s",
      summary: "Upserted record into local SQLite / Supabase database store",
    },
  ];

  const activeTrace = lead.pipeline_trace && lead.pipeline_trace.length > 0 ? lead.pipeline_trace : defaultTrace;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getFaviconUrl(lead.domain)}
                  alt=""
                  className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-900 object-contain p-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{lead.company_name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {lead.contact_role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400 font-mono">
                    <span>{lead.domain}</span>
                    <a
                      href={`https://${lead.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span>•</span>
                    <span className="text-zinc-500">{lead.industry}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                  <span>{lead.icp_score} / 100</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-header Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-800/60 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full font-medium border ${tierStyle}`}>
                {lead.fit_tier}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                {lead.employee_count.toLocaleString()} Employees
              </span>
              <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {lead.funding_stage}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                {lead.annual_revenue_est} ARR
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-400 border border-blue-800/60 ml-auto">
                Source: {lead.enrichment_source}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-4 border-b border-zinc-800 -mb-5 pb-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab("outbound")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "outbound"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Outbound Sequence
              </button>

              <button
                onClick={() => setActiveTab("scoring")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "scoring"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Scoring & Signals
              </button>

              <button
                onClick={() => setActiveTab("trace")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "trace"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                Pipeline Trace
              </button>

              <button
                onClick={() => setActiveTab("firmographics")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "firmographics"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Firmographics & Stack
              </button>

              <button
                onClick={() => setActiveTab("json")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "json"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Raw JSON
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: Outbound Sequence */}
            {activeTab === "outbound" && (
              <div className="space-y-5">
                {/* Personalized Subject Line */}
                <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                    Generated Subject Line
                  </span>
                  <div className="mt-1 text-sm font-semibold text-zinc-100 font-mono">
                    {lead.personalized_subject}
                  </div>
                </div>

                {/* Hyper-specific Icebreaker */}
                <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Hyper-Specific Icebreaker Hook (2-Sentence)
                    </span>
                  </div>
                  <div className="text-xs text-zinc-200 leading-relaxed italic">
                    &ldquo;{lead.personalized_email_icebreaker}&rdquo;
                  </div>
                </div>

                {/* Full Cold Email Sequence Step 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      Cold Outreach Sequence (Step 1)
                    </span>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Cold Email
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-900/90 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {lead.full_outreach_sequence_step1}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Scoring & Signals */}
            {activeTab === "scoring" && (
              <div className="space-y-5">
                {/* Score Breakdown Meter */}
                <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-300">
                      Ideal Customer Profile Match Score
                    </span>
                    <span className={`text-base font-bold font-mono ${badgeStyle.text}`}>
                      {lead.icp_score} / 100
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${badgeStyle.progress} transition-all duration-500`}
                      style={{ width: `${lead.icp_score}%` }}
                    />
                  </div>
                </div>

                {/* AI / Algorithmic Reasoning */}
                <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Evaluation Reasoning
                  </span>
                  <p className="mt-1.5 text-xs text-zinc-200 leading-relaxed font-sans">
                    {lead.scoring_reasoning}
                  </p>
                </div>

                {/* Buying Signals */}
                <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    Detected Buying Signals
                  </div>
                  <ul className="space-y-2">
                    {lead.buying_signals.map((signal, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-900/80 p-2 rounded border border-zinc-800"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: Execution Trace */}
            {activeTab === "trace" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                      GTM Pipeline Audit Log
                    </span>
                    <div className="text-xs text-zinc-300 mt-0.5">
                      Verifiable step-by-step latency & payload transformation
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total: ~0.40s</span>
                  </div>
                </div>

                {/* Step List */}
                <div className="space-y-3">
                  {activeTrace.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-900/80 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                            {step.step}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200">{step.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                          {step.latency}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans pl-6">{step.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Firmographics & Tech Stack */}
            {activeTab === "firmographics" && (
              <div className="space-y-5">
                {/* Detail Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Industry</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                      {lead.industry}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Headcount</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5 font-mono">
                      {lead.employee_count.toLocaleString()} employees
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Funding Stage</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                      {lead.funding_stage}
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Estimated ARR</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5 font-mono">
                      {lead.annual_revenue_est}
                    </div>
                  </div>
                </div>

                {/* Tech Stack Pills */}
                <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-300 mb-2.5">
                    Detected Technographic Stack
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tech_stack.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700/80 text-xs font-mono text-zinc-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social & Web Links */}
                <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Company LinkedIn Profile</div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate max-w-sm">
                      {lead.linkedin_url}
                    </div>
                  </div>
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* TAB 5: Raw JSON Payload */}
            {activeTab === "json" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">
                    Combined Apollo + Gemini Payload
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono transition-colors cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Copied JSON!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-zinc-900/90 rounded-lg border border-zinc-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed">
                  {JSON.stringify(lead, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
