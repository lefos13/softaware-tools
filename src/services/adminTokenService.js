/*
  Superadmin token management uses one authenticated client so the browser can
  list, create, update, revoke, renew, and extend access tokens consistently.
*/
import { buildUrl, parseApiError } from "./apiClient";

const buildAuthHeaders = (token) => ({
  Accept: "application/json",
  "x-admin-token": String(token || "").trim(),
});

const buildJsonHeaders = (token) => ({
  ...buildAuthHeaders(token),
  "Content-Type": "application/json",
});

const readJsonData = async (response, fallback) => {
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || fallback;
};

export const listAccessTokens = async (baseUrl, token) => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens"), {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  return readJsonData(response, { count: 0, tokens: [], availableServiceFlags: [] });
};

export const createAccessToken = async (baseUrl, token, payload) => {
  const response = await fetch(buildUrl(baseUrl, "/api/admin/tokens"), {
    method: "POST",
    headers: buildJsonHeaders(token),
    body: JSON.stringify(payload || {}),
  });

  return readJsonData(response, null);
};

export const updateAccessToken = async (baseUrl, token, tokenId, payload) => {
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

export const revokeAccessToken = async (baseUrl, token, tokenId) => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/revoke`),
    {
      method: "POST",
      headers: buildAuthHeaders(token),
    }
  );

  return readJsonData(response, null);
};

export const renewAccessToken = async (baseUrl, token, tokenId, ttl) => {
  const response = await fetch(
    buildUrl(baseUrl, `/api/admin/tokens/${encodeURIComponent(tokenId)}/renew`),
    {
      method: "POST",
      headers: buildJsonHeaders(token),
      body: JSON.stringify({ ttl }),
    }
  );

  return readJsonData(response, null);
};

export const extendAccessToken = async (baseUrl, token, tokenId, ttl) => {
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
