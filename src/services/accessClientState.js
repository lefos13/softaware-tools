/*
  Shared token state lives in one browser key so every service screen can use
  the same paid plan without duplicating per-tool storage or validation logic.
*/
export const ACCESS_TOKEN_STORAGE_KEY = "portal_active_service_token";
export const ACCESS_USAGE_UPDATED_EVENT = "portal-access-usage-updated";

export const readActiveServiceToken = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
};

export const writeActiveServiceToken = (value) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = String(value || "").trim();
  if (normalized) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, normalized);
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const emitAccessUsageUpdated = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ACCESS_USAGE_UPDATED_EVENT));
};
