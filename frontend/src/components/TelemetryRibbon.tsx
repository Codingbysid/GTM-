"use client";

import React from "react";
import { TelemetryMetrics } from "@/types/lead";
import { Users, Target, Award, Clock, Activity, ShieldCheck, Zap } from "lucide-react";

interface TelemetryRibbonProps {
  metrics: TelemetryMetrics | null;
  loading: boolean;
  systemHealth?: {
    apollo_enrichment: string;
    gemini_scorer: string;
    database: string;
  } | null;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  metrics,
  loading,
  systemHealth,
}) => {
  const cards = [
    {
      label: "Total Leads Processed",
      value: metrics ? metrics.total_leads.toLocaleString() : "0",
      change: "Enriched & Scored",
      icon: Users,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "Tier 1 ICP Match Rate",
      value: metrics ? `${metrics.tier_1_match_rate}%` : "0%",
      change: `${metrics?.tier_1_count || 0} Hot Targets`,
      icon: Target,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Avg ICP Fit Score",
      value: metrics ? `${metrics.avg_icp_score}` : "0",
      change: "Scale: 0 - 100",
      icon: Award,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "Est. SDR Hours Saved",
      value: metrics ? `${metrics.sdr_hours_saved}h` : "0h",
      change: "0.25h / lead manual research",
      icon: Clock,
      color: "text-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Engine Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-300">Live Pipeline Engine</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-zinc-400">Enrichment:</span>
            <span className="text-zinc-200">
              {systemHealth?.apollo_enrichment === "live_api" ? "Apollo.io Live" : "Local Engine (Zero-Key)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span className="text-zinc-400">Scorer:</span>
            <span className="text-zinc-200">
              {systemHealth?.gemini_scorer === "google_genai_live" ? "Gemini 2.5 Structured" : "Algorithmic Scorer (Zero-Key)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-zinc-400">Storage:</span>
            <span className="text-zinc-200">
              {systemHealth?.database === "supabase_postgresql" ? "Supabase Cloud" : "SQLite Store (Zero-Key)"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-lg border ${card.border} ${card.bg} backdrop-blur-sm transition-all duration-200 hover:border-zinc-700`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{card.label}</span>
                <div className={`p-1.5 rounded-md bg-zinc-900/80 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">
                  {loading && !metrics ? "..." : card.value}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
