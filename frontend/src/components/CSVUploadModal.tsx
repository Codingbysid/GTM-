"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle, Zap } from "lucide-react";

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Please select a valid CSV file (.csv).");
        return;
      }
      setSelectedFile(file);
      setError(null);

      // Read first few lines for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 4);
        setPreviewRows(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file first.");
      return;
    }
    setError(null);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      setPreviewRows([]);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process CSV file.";
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

      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upload Target Account CSV</h3>
              <p className="text-[11px] text-zinc-400">
                Batch ingest domains for concurrent enrichment & ICP scoring
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

        {error && (
          <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-xl p-8 text-center cursor-pointer bg-zinc-900/30 transition-all duration-200"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div>
                <div className="text-xs font-semibold text-zinc-100">{selectedFile.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready to batch process
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Click to browse or drop CSV here
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Expected columns: <code className="text-zinc-400">company_name,domain,contact_role</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview snippet */}
        {previewRows.length > 0 && (
          <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
            <span className="text-[10px] font-mono uppercase text-zinc-500">File Preview</span>
            <div className="mt-1 space-y-1 font-mono text-[11px] text-zinc-300">
              {previewRows.map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            {isUploading ? "Processing Batch (Concurrency = 5)..." : "Start Enrichment Batch"}
          </button>
        </div>
      </div>
    </div>
  );
};
