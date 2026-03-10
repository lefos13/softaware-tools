/*
  Health checks drive the top-level app guard, so the client returns one
  normalized payload shape instead of leaking raw response envelopes upward.
*/
import { buildUrl, parseApiError } from "./apiClient";
import type { ApiEnvelope } from "../types/shared";
import type { HealthStatus } from "../types/services";

export const getHealthStatus = async (baseUrl: string): Promise<HealthStatus> => {
  const response = await fetch(buildUrl(baseUrl, "/api/health"), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as ApiEnvelope<{
    status?: string;
  }>;
  return {
    status: payload?.data?.status || "unknown",
    message: payload?.message || "Health check completed",
    requestId: payload?.meta?.requestId || "",
  };
};
