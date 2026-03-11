/*
  Superadmin token management uses one authenticated client so the browser can
  list, create, update, revoke, renew, extend, and reset access token usage
  consistently from one authenticated control-plane client.
*/
import { buildUrl, parseApiError } from "./apiClient";
import type {
  AccessDashboardQuery,
  AccessHistoryResult,
  AccessTokenRequestListResult,
  AccessTokenRequestResult,
  AccessTokenMutationPayload,
  AccessTokenMutationResult,
  ListAccessTokensData,
} from "../types/services";

const buildAuthHeaders = (token?: string) => ({
  Accept: "application/json",
  "x-admin-token": String(token || "").trim(),
});

const buildJsonHeaders = (token?: string) => ({
  ...buildAuthHeaders(token),
  "Content-Type": "application/json",
});

const readJsonData = async <TData>(response: Response, fallback: TData): Promise<TData> => {
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { data?: TData };
  return payload?.data || fallback;
};

export const listAccessTokens = async (
  baseUrl: string,
  token: string
): Promise<ListAccessTokensData> => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens"), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  return readJsonData(response, { count: 0, tokens: [], availableServiceFlags: [] });
};

/*
  Superadmins need the same sortable usage history that token owners see, but
  scoped to an arbitrary token id selected from the admin catalog.
*/
export const fetchAccessTokenHistory = async (
  baseUrl: string,
  token: string,
  tokenId: string,
  options: AccessDashboardQuery = {}
): Promise<AccessHistoryResult | null> => {
  const searchParams = new URLSearchParams();
  if (options.page) {
    searchParams.set("page", String(options.page));
  }
  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }
  if (options.serviceKey) {
    searchParams.set("serviceKey", String(options.serviceKey));
  }
  if (options.status) {
    searchParams.set("status", String(options.status));
  }
  if (options.sortBy) {
    searchParams.set("sortBy", String(options.sortBy));
  }
  if (options.sortDirection) {
    searchParams.set("sortDirection", String(options.sortDirection));
  }

  const query = searchParams.toString();
  const response = await fetch(
    `${buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/history`)}${
      query ? `?${query}` : ""
    }`,
    {
      method: "GET",
      headers: buildAuthHeaders(token),
    }
  );

  return readJsonData(response, null);
};

export const listTokenRequests = async (
  baseUrl: string,
  token: string,
  status = "pending"
): Promise<AccessTokenRequestListResult> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(buildUrl(baseUrl, `/api/admin/token-requests${query}`), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  return readJsonData(response, { count: 0, pendingCount: 0, requests: [] });
};

/*
  Request review actions stay in the admin service layer so the inbox and token
  catalog screen use the same authenticated control-plane client.
*/
export const approveTokenRequest = async (
  baseUrl: string,
  token: string,
  requestId: string,
  ttl?: string
): Promise<AccessTokenRequestResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/token-requests/${encodeURIComponent(requestId)}/approve`),
    {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify(ttl ? { ttl } : {}),
    }
  );

  return readJsonData(response, null);
};

export const rejectTokenRequest = async (
  baseUrl: string,
  token: string,
  requestId: string,
  reason?: string
): Promise<AccessTokenRequestResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/token-requests/${encodeURIComponent(requestId)}/reject`),
    {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify(reason ? { reason } : {}),
    }
  );

  return readJsonData(response, null);
};

export const createAccessToken = async (
  baseUrl: string,
  token: string,
  payload: AccessTokenMutationPayload
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens"), {
    method: "POST",
    headers: buildJsonHeaders(token),
    body: JSON.stringify(payload || {}),
  });

  return readJsonData(response, null);
};

export const updateAccessToken = async (
  baseUrl: string,
  token: string,
  tokenId: string,
  payload: AccessTokenMutationPayload
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}`),
    {
      method: "PATCH",
      headers: buildJsonHeaders(token),
      body: JSON.stringify(payload || {}),
    }
  );

  return readJsonData(response, null);
};

export const revokeAccessToken = async (
  baseUrl: string,
  token: string,
  tokenId: string
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/revoke`),
    {
      method: "POST",
      headers: buildAuthHeaders(token),
    }
  );

  return readJsonData(response, null);
};

export const renewAccessToken = async (
  baseUrl: string,
  token: string,
  tokenId: string,
  ttl: string,
  payload: AccessTokenMutationPayload = {}
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/renew`),
    {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({
        ttl,
        servicePolicies: payload?.servicePolicies || {},
      }),
    }
  );

  return readJsonData(response, null);
};

export const extendAccessToken = async (
  baseUrl: string,
  token: string,
  tokenId: string,
  ttl: string
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/extend`),
    {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ ttl }),
    }
  );

  return readJsonData(response, null);
};

export const resetAccessTokenUsage = async (
  baseUrl: string,
  token: string,
  tokenId: string
): Promise<AccessTokenMutationResult | null> => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/reset-usage`),
    {
      method: "POST",
      headers: buildAuthHeaders(token),
    }
  );

  return readJsonData(response, null);
};
