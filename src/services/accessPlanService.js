/*
  Access-plan requests centralize the new free-versus-token contract so the
  portal shell, dashboard, and service wrappers all read the same payloads.
*/
import { buildUrl, parseApiError } from "./apiClient";
import { readActiveServiceToken } from "./accessClientState";

const buildServiceHeaders = (serviceToken) => {
  const token = String(serviceToken ?? readActiveServiceToken()).trim();
  return token
    ? {
        Accept: "application/json",
        "x-service-token": token,
      }
    : {
        Accept: "application/json",
      };
};

export const fetchAccessPlan = async (baseUrl, serviceToken) => {
  const response = await fetch(buildUrl(baseUrl, "/api/access/plan"), {
    method: "GET",
    headers: buildServiceHeaders(serviceToken),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};

export const fetchAccessDashboard = async (baseUrl, serviceToken, options = {}) => {
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
    `${buildUrl(baseUrl, "/api/access/dashboard")}${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: buildServiceHeaders(serviceToken),
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};
