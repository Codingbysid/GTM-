import { LeadRecord, TelemetryMetrics, EnrichSinglePayload } from "@/types/lead";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchTelemetry(): Promise<TelemetryMetrics> {
  const res = await fetch(`${API_BASE_URL}/api/telemetry`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch telemetry: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLeads(params?: {
  fitTier?: string;
  minScore?: number;
  search?: string;
}): Promise<LeadRecord[]> {
  const query = new URLSearchParams();
  if (params?.fitTier && params.fitTier !== "all") {
    query.set("fit_tier", params.fitTier);
  }
  if (params?.minScore !== undefined && params.minScore > 0) {
    query.set("min_score", params.minScore.toString());
  }
  if (params?.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }

  const url = `${API_BASE_URL}/api/leads?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch leads: ${res.statusText}`);
  }
  return res.json();
}

export async function enrichSingleLead(payload: EnrichSinglePayload): Promise<LeadRecord> {
  const res = await fetch(`${API_BASE_URL}/api/leads/enrich-single`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to enrich lead");
  }
  return res.json();
}

export async function uploadCsv(file: File, icpCriteria?: string): Promise<LeadRecord[]> {
  const formData = new FormData();
  formData.append("file", file);
  if (icpCriteria) {
    formData.append("icp_criteria", icpCriteria);
  }

  const res = await fetch(`${API_BASE_URL}/api/leads/upload-csv`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to upload CSV");
  }
  return res.json();
}

export async function runSampleBatch(icpCriteria?: string): Promise<LeadRecord[]> {
  const query = new URLSearchParams();
  if (icpCriteria) {
    query.set("icp_criteria", icpCriteria);
  }
  const url = `${API_BASE_URL}/api/leads/run-sample?${query.toString()}`;
  const res = await fetch(url, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Failed to run sample batch");
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/leads/reset`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to reset database: ${res.statusText}`);
  }
  return res.json();
}

export function getExportCsvUrl(): string {
  return `${API_BASE_URL}/api/leads/export-csv`;
}

export async function fetchHealth(): Promise<{
  status: string;
  providers: {
    apollo_enrichment: string;
    gemini_scorer: string;
    database: string;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Backend offline");
  }
  return res.json();
}
