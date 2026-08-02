import { httpJson } from "@/api/http";

export type HealthResponse = { ok: boolean };

export async function fetchHealth(): Promise<HealthResponse> {
  return await httpJson<HealthResponse>("/api/health/", {
    cache: "no-store",
  });
}
