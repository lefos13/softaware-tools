/*
  Superadmin token management uses one authenticated client so the browser can
  list, create, update, revoke, renew, extend, and reset access token usage
  consistently from one authenticated control-plane client.
*/
import { buildUrl, parseApiError } from "./apiClient";
import type {
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
