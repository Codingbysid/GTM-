"use client";

import React from "react";
import { LeadRecord } from "@/types/lead";
import { getFaviconUrl, getScoreBadgeStyles, getTierBadgeStyles } from "@/lib/utils";
import { Search, ExternalLink, ChevronRight, Sparkles, Database, Zap } from "lucide-react";

interface LeadsTableProps {
  leads: LeadRecord[];
  loading: boolean;
  onSelectLead: (lead: LeadRecord) => void;
  onTriggerDemo: () => void;
  currentTierFilter: string;
  onTierFilterChange: (tier: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  minScoreFilter: number;
  onMinScoreChange: (score: number) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  onSelectLead,
  onTriggerDemo,
  currentTierFilter,
  onTierFilterChange,
  searchQuery,
  onSearchChange,
  minScoreFilter,
  onMinScoreChange,
}) => {
  const tiers = [
    { id: "all", label: "All Leads" },
    { id: "Tier 1 - Hot", label: "Tier 1 - Hot" },
    { id: "Tier 2 - Warm", label: "Tier 2 - Warm" },
    { id: "Tier 3 - Disqualified", label: "Tier 3 - Disqualified" },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Table Header Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 border-b border-zinc-800/80 bg-zinc-900/40">
        {/* Tier Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => onTierFilterChange(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                currentTierFilter === t.id
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Min Score Slider */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter company or domain..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-48 sm:w-60"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span>Min Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minScoreFilter}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="w-20 accent-blue-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-6 text-zinc-200">{minScoreFilter}</span>
          </div>
        </div>
      </div>

      {/* High-density Clay/Linear Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 font-mono tracking-wider uppercase text-[10px]">
              <th className="py-2.5 px-3 font-semibold">Company & Domain</th>
              <th className="py-2.5 px-3 font-semibold">Firmographics</th>
              <th className="py-2.5 px-3 font-semibold">Detected Tech Stack</th>
              <th className="py-2.5 px-3 font-semibold">ICP Score</th>
              <th className="py-2.5 px-3 font-semibold">Fit Tier</th>
              <th className="py-2.5 px-3 font-semibold">AI Icebreaker Preview</th>
              <th className="py-2.5 px-3 font-semibold text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {loading && leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Enriching and scoring target accounts...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                      <Database className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-sm font-medium text-zinc-200">No leads found in this view</div>
                    <p className="text-xs text-zinc-500">
                      Run the demo pipeline to ingest and score 10 realistic B2B SaaS accounts, or upload your own CSV file.
                    </p>
                    <button
                      onClick={onTriggerDemo}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      ⚡ Run 10-Lead Demo Pipeline
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const badgeStyle = getScoreBadgeStyles(lead.icp_score);
                const tierStyle = getTierBadgeStyles(lead.fit_tier);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                  >
                    {/* Company & Domain */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getFaviconUrl(lead.domain)}
                          alt=""
                          className="w-5 h-5 rounded border border-zinc-800 bg-zinc-900 object-contain p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>";
                          }}
                        />
                        <div>
                          <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                            {lead.company_name}
                            <span className="text-[10px] text-zinc-500 font-normal">
                              ({lead.contact_role})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                            <span>{lead.domain}</span>
                            <a
                              href={`https://${lead.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-zinc-600 hover:text-zinc-400"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Firmographics */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
                          {lead.employee_count.toLocaleString()} hc
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
                          {lead.funding_stage}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[140px]">
                        {lead.industry}
                      </div>
                    </td>

                    {/* Detected Tech Stack */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                        {lead.tech_stack.slice(0, 3).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                          >
                            {tech}
                          </span>
                        ))}
                        {lead.tech_stack.length > 3 && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            +{lead.tech_stack.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ICP Score */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                          {lead.icp_score}
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${badgeStyle.progress}`}
                            style={{ width: `${lead.icp_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Fit Tier */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${tierStyle}`}
                      >
                        {lead.fit_tier}
                      </span>
                    </td>

                    {/* AI Icebreaker Preview */}
                    <td className="py-2.5 px-3 max-w-[280px]">
                      <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] truncate">
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{lead.personalized_email_icebreaker}</span>
                      </div>
                    </td>

                    {/* Inspect Payload Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 group-hover:translate-x-0.5 transition-all cursor-pointer"
                      >
                        Inspect Payload
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
        <div>
          Showing {leads.length} accounts • Real-time ICP Scoring & Outbound Engine
        </div>
        <div className="flex items-center gap-3">
          <span>Sort: ICP Score (DESC)</span>
        </div>
      </div>
    </div>
  );
};
