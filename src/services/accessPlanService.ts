/*
  Access-plan requests centralize the new free-versus-token contract so the
  portal shell, dashboard, and service wrappers all read the same payloads.
*/
import { buildUrl, parseApiError } from "./apiClient";
import { readActiveServiceToken } from "./accessClientState";
import type {
  AccessPlanCatalogResult,
  AccessDashboardQuery,
  AccessDashboardResult,
  AccessPlanResult,
  AccessTokenRequestPayload,
  AccessTokenRequestResult,
} from "../types/services";

const buildServiceHeaders = (serviceToken?: string): Record<string, string> => {
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

export const fetchAccessPlan = async (
  baseUrl: string,
  serviceToken?: string
): Promise<AccessPlanResult | null> => {
  const response = await fetch(buildUrl(baseUrl, "/api/access/plan"), {
    method: "GET",
    headers: buildServiceHeaders(serviceToken),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { data?: AccessPlanResult | null };
  return payload?.data || null;
};

export const fetchAccessDashboard = async (
  baseUrl: string,
  serviceToken?: string,
  options: AccessDashboardQuery = {}
): Promise<AccessDashboardResult | null> => {
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

  const payload = (await response.json()) as { data?: AccessDashboardResult | null };
  return payload?.data || null;
};

/*
  Public plan discovery and token-request submission share the access client so
  the plans screen stays aligned with backend presets and request validation.
*/
export const fetchAccessPlanCatalog = async (
  baseUrl: string
): Promise<AccessPlanCatalogResult | null> => {
  const response = await fetch(buildUrl(baseUrl, "/api/access/catalog"), {
    method: "GET",
    headers: buildServiceHeaders(""),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { data?: AccessPlanCatalogResult | null };
  return payload?.data || null;
};

export const submitTokenRequest = async (
  baseUrl: string,
  request: AccessTokenRequestPayload
): Promise<AccessTokenRequestResult | null> => {
  const response = await fetch(buildUrl(baseUrl, "/api/access/token-requests"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { data?: AccessTokenRequestResult | null };
  return payload?.data || null;
};
