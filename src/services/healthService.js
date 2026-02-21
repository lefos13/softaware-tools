// Health service now returns both status and message so UI can show contract-level feedback beyond raw service state.
import { buildUrl, parseApiError } from "./apiClient";

export const getHealthStatus = async (baseUrl) => {
  const response = await fetch(buildUrl(baseUrl, "/api/health"), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return {
    status: payload?.data?.status || "unknown",
    message: payload?.message || "Health check completed",
    requestId: payload?.meta?.requestId || "",
  };
};
