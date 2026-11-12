"use client";

import React from "react";
import { Zap, Upload, Sliders, Globe, Download, RefreshCw } from "lucide-react";
import { getExportCsvUrl } from "@/lib/api";

interface PipelineControlBarProps {
  onRunSample: () => void;
  onOpenSingleTest: () => void;
  onOpenUpload: () => void;
  onOpenICPConfig: () => void;
  onResetDb: () => void;
  isRunningBatch: boolean;
  totalLeads: number;
}

export const PipelineControlBar: React.FC<PipelineControlBarProps> = ({
  onRunSample,
  onOpenSingleTest,
  onOpenUpload,
  onOpenICPConfig,
  onResetDb,
  isRunningBatch,
  totalLeads,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg backdrop-blur-sm">
      {/* Left controls: Batch Triggers */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Prominent Demo Batch Trigger */}
        <button
          onClick={onRunSample}
          disabled={isRunningBatch}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Zap className={`w-3.5 h-3.5 ${isRunningBatch ? "animate-spin text-amber-300" : "text-amber-300"}`} />
          {isRunningBatch ? "Executing Pipeline..." : "⚡ Run 10-Lead Demo Pipeline"}
        </button>

        {/* Single Domain Test */}
        <button
          onClick={onOpenSingleTest}
          disabled={isRunningBatch}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Single Domain Live Test
        </button>

        {/* CSV Upload */}
        <button
          onClick={onOpenUpload}
          disabled={isRunningBatch}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          Upload CSV
        </button>
      </div>

      {/* Right controls: Config, Export, Reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* ICP Criteria Config Drawer Trigger */}
        <button
          onClick={onOpenICPConfig}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          Configure ICP Criteria
        </button>

        {/* Export to CSV for Smartlead / Instantly */}
        <a
          href={getExportCsvUrl()}
          download
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors ${
            totalLeads === 0 ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          Export to Outbound CSV ↗
        </a>

        {/* Reset Database */}
        <button
          onClick={onResetDb}
          disabled={isRunningBatch}
          title="Reset database and re-seed 10 demo leads"
          className="flex items-center justify-center p-2 rounded-md bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
