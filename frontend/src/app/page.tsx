"use client";

import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  fetchTelemetry,
  fetchLeads,
  fetchHealth,
  runSampleBatch,
  enrichSingleLead,
  uploadCsv,
  resetDatabase,
} from "@/lib/api";
import { LeadRecord, TelemetryMetrics } from "@/types/lead";
import { TelemetryRibbon } from "@/components/TelemetryRibbon";
import { PipelineControlBar } from "@/components/PipelineControlBar";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadDrawer } from "@/components/LeadDrawer";
import { ICPConfigModal } from "@/components/ICPConfigModal";
import { SingleEnrichModal } from "@/components/SingleEnrichModal";
import { CSVUploadModal } from "@/components/CSVUploadModal";
import { Sparkles, Layers, Cpu, ArrowUpRight } from "lucide-react";

export default function RevOpsDashboard() {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [isSingleEnriching, setIsSingleEnriching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Filters & Search
  const [tierFilter, setTierFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Modals
  const [isICPModalOpen, setIsICPModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ICP Criteria State
  const [icpCriteria, setIcpCriteria] = useState(
    "Target Series A to Series C B2B SaaS or FinTech companies with 20 to 300 employees using cloud infrastructure (AWS/GCP), Python, or modern data stacks who need AI workflow automation or GTM data pipelines."
  );

  // System Health
  const [health, setHealth] = useState<{
    apollo_enrichment: string;
    gemini_scorer: string;
    database: string;
  } | null>(null);

  // Banner message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [telemetryData, leadsData, healthData] = await Promise.allSettled([
        fetchTelemetry(),
        fetchLeads({
          fitTier: tierFilter,
          minScore: minScoreFilter,
          search: searchQuery,
        }),
        fetchHealth(),
      ]);

      if (telemetryData.status === "fulfilled") {
        setMetrics(telemetryData.value);
      }
      if (leadsData.status === "fulfilled") {
        setLeads(leadsData.value);
      }
      if (healthData.status === "fulfilled") {
        setHealth(healthData.value.providers);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [tierFilter, minScoreFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Demo Pipeline Trigger
  const handleRunSampleBatch = async () => {
    setIsRunningBatch(true);
    setStatusMessage("⚡ Executing 10-lead demo pipeline through Apollo & Gemini...");
    try {
      const newLeads = await runSampleBatch(icpCriteria);
      await loadData();
      setStatusMessage(`✓ Successfully enriched & scored ${newLeads.length} target accounts!`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pipeline execution failed";
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsRunningBatch(false);
    }
  };

  // Handle Single Domain Enrich
  const handleSingleEnrich = async (payload: {
    domain: string;
    company_name?: string;
    contact_role?: string;
  }) => {
    setIsSingleEnriching(true);
    try {
      const newLead = await enrichSingleLead({
        ...payload,
        icp_criteria: icpCriteria,
      });
      await loadData();
      setSelectedLead(newLead);
      setStatusMessage(`✓ Live enriched & scored ${newLead.company_name} (${newLead.domain})`);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSingleEnriching(false);
    }
  };

  // Handle CSV Upload
  const handleCsvUpload = async (file: File) => {
    setIsUploading(true);
    setStatusMessage("Ingesting CSV domains and processing batch with concurrency limit...");
    try {
      const processed = await uploadCsv(file, icpCriteria);
      await loadData();
      setStatusMessage(`✓ Ingested and processed ${processed.length} leads from CSV!`);
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Database Reset
  const handleResetDb = async () => {
    if (!confirm("Reset database and re-seed 10 demo target accounts?")) return;
    setIsRunningBatch(true);
    setStatusMessage("Resetting database and generating 10 fresh demo leads...");
    try {
      await resetDatabase();
      await loadData();
      setStatusMessage("✓ Database re-seeded with 10 demo accounts.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setStatusMessage(`Reset error: ${msg}`);
    } finally {
      setIsRunningBatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold text-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  GTM Enrichment Engine
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  RevOps Command Center
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>FastAPI + Gemini 2.5 + Clay Grid</span>
            </div>

            <a
              href="https://github.com/Codingbysid/GTM-"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/60 border border-blue-800/80 text-xs text-blue-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-blue-400 hover:text-blue-200 text-xs ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Top Telemetry Ribbon */}
        <TelemetryRibbon
          metrics={metrics}
          loading={loading}
          systemHealth={health}
        />

        {/* 2. Interactive Pipeline Control Bar */}
        <PipelineControlBar
          onRunSample={handleRunSampleBatch}
          onOpenSingleTest={() => setIsSingleModalOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenICPConfig={() => setIsICPModalOpen(true)}
          onResetDb={handleResetDb}
          isRunningBatch={isRunningBatch}
          totalLeads={leads.length}
        />

        {/* 3. Clay-Style Enriched Data Grid */}
        <LeadsTable
          leads={leads}
          loading={loading || isRunningBatch}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onTriggerDemo={handleRunSampleBatch}
          currentTierFilter={tierFilter}
          onTierFilterChange={(t) => setTierFilter(t)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          minScoreFilter={minScoreFilter}
          onMinScoreChange={(s) => setMinScoreFilter(s)}
        />
      </main>

      {/* Slide-over Inspection Drawer */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      {/* Modals */}
      <ICPConfigModal
        isOpen={isICPModalOpen}
        onClose={() => setIsICPModalOpen(false)}
        currentCriteria={icpCriteria}
        onSaveCriteria={(c) => {
          setIcpCriteria(c);
          setStatusMessage("✓ Updated target ICP criteria prompt.");
          setTimeout(() => setStatusMessage(null), 3000);
        }}
      />

      <SingleEnrichModal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        onSubmit={handleSingleEnrich}
        isSubmitting={isSingleEnriching}
      />

      <CSVUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleCsvUpload}
        isUploading={isUploading}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-4 mt-auto text-center text-xs text-zinc-500 font-mono">
        Automated GTM Lead Enrichment & ICP Scoring Engine • Built with Next.js 14, FastAPI, Apollo & Gemini
      </footer>
    </div>
  );
}
