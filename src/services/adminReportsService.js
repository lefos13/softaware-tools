/*
  Admin report helpers always attach x-admin-token so list/detail/invalidation
  requests stay scoped to the authenticated admin or superadmin session.
*/
import { buildUrl, parseApiError } from "./apiClient";

const buildAuthHeaders = (token) => ({
  Accept: "application/json",
  "x-admin-token": String(token || "").trim(),
});

export const listFailureReports = async (baseUrl, token, limit = 100) => {
  const safeLimit = Number.isInteger(limit) ? limit : 100;
  const query = `?limit=${encodeURIComponent(String(safeLimit))}`;
  const response = await fetch(buildUrl(baseUrl, `/api/admin/reports${query}`), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || { count: 0, reports: [] };
};

export const getFailureReport = async (baseUrl, token, fileName) => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/reports/${encodeURIComponent(fileName)}`),
    {
      method: "GET",
      headers: buildAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};

export const listAdminTokens = async (baseUrl, token) => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens"), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || { count: 0, tokens: [], currentTokenId: null };
};

/*
  Superadmin token revocation uses the same x-admin-token auth header so the
  selected token ids can be revoked without exposing token material in the UI.
*/
export const revokeAdminTokens = async (baseUrl, token, tokenIds) => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens/revoke"), {
    method: "POST",
    headers: {
      ...buildAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tokenIds: Array.isArray(tokenIds) ? tokenIds : [],
    }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};

export const invalidateAllAdminTokens = async (baseUrl, token) => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens/invalidate-all"), {
    method: "POST",
    headers: buildAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};
