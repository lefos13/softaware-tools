/*
  Access-facing views reuse one service-group label mapper so backend service
  keys never leak into the UI and every screen matches the launcher naming.
*/
import type { PortalI18n, ServiceKey } from "../types/shared";

const SERVICE_LABEL_KEYS: Record<string, string> = {
  books_greek_editor: "serviceGroups.books",
  pdf: "serviceGroups.pdf",
  image: "serviceGroups.image",
  tasks: "serviceGroups.json",
};

export const formatAccessServiceLabel = (
  t: PortalI18n["t"],
  serviceKey?: ServiceKey | string | null
): string => {
  const normalizedKey = String(serviceKey || "").trim();
  if (!normalizedKey) {
    return "";
  }

  const translationKey = SERVICE_LABEL_KEYS[normalizedKey];
  return translationKey ? t(translationKey) : normalizedKey;
};
