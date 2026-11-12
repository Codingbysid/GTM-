"use client";

import React, { useState } from "react";
import { X, Globe, Sparkles } from "lucide-react";

interface SingleEnrichModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { domain: string; company_name?: string; contact_role?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const SingleEnrichModal: React.FC<SingleEnrichModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [domain, setDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactRole, setContactRole] = useState("VP of Engineering");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError("Domain is required.");
      return;
    }
    setError(null);
    try {
      await onSubmit({
        domain: domain.trim(),
        company_name: companyName.trim() || undefined,
        contact_role: contactRole.trim() || "VP of Engineering",
      });
      setDomain("");
      setCompanyName("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enrich domain.";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Single Domain Live Test</h3>
              <p className="text-[11px] text-zinc-400">
                Test enrichment, ICP scoring, and cold email generation live
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-300">
              Company Domain <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ramp.com or resend.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">Company Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Ramp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300">Target Contact Role</label>
            <input
              type="text"
              placeholder="e.g. VP of Engineering"
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isSubmitting ? "Running Pipeline..." : "Enrich & Score"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
