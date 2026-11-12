"use client";

import React, { useState } from "react";
import { X, Sliders, RotateCcw, Check } from "lucide-react";

const DEFAULT_CRITERIA =
  "Target Series A to Series C B2B SaaS or FinTech companies with 20 to 300 employees using cloud infrastructure (AWS/GCP), Python, or modern data stacks who need AI workflow automation or GTM data pipelines.";

interface ICPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCriteria: string;
  onSaveCriteria: (criteria: string) => void;
}

export const ICPConfigModal: React.FC<ICPConfigModalProps> = ({
  isOpen,
  onClose,
  currentCriteria,
  onSaveCriteria,
}) => {
  const [text, setText] = useState(currentCriteria || DEFAULT_CRITERIA);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCriteria(text.trim() || DEFAULT_CRITERIA);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setText(DEFAULT_CRITERIA);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Ideal Customer Profile (ICP) Criteria</h3>
              <p className="text-[11px] text-zinc-400">
                Custom prompt criteria evaluated by Gemini Structured Outputs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Target Criteria Prompt</label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Define your ideal target accounts..."
            className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-sans leading-relaxed resize-none"
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Passed as context to Gemini 2.5 Structured Output Scorer</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-zinc-400 hover:text-purple-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Default
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              "Save Criteria"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
