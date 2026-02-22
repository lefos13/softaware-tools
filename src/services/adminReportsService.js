// Why this exists: frontend admin screen needs typed helpers for report list/detail API requests.
import { buildUrl, parseApiError } from "./apiClient";

export const listFailureReports = async (baseUrl, limit = 100) => {
  const safeLimit = Number.isInteger(limit) ? limit : 100;
  const query = `?limit=${encodeURIComponent(String(safeLimit))}`;
  const response = await fetch(buildUrl(baseUrl, `/api/admin/reports${query}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || { count: 0, reports: [] };
};

export const getFailureReport = async (baseUrl, fileName) => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/reports/${encodeURIComponent(fileName)}`),
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};
