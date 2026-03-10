/*
  Task progress polling is shared by long-running upload flows, so these
  helpers return one normalized task payload shape instead of leaving each
  composable to parse nullable backend responses on its own.
*/
import { buildUrl, parseApiError } from "./apiClient";
import { readActiveServiceToken } from "./accessClientState";
import type { TaskProgress } from "../types/services";

export const getTaskProgress = async (
  baseUrl: string,
  taskId: string
): Promise<TaskProgress | null> => {
  const response = await fetch(buildUrl(baseUrl, `/api/tasks/${encodeURIComponent(taskId)}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(readActiveServiceToken() ? { "x-service-token": readActiveServiceToken() } : {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as { data?: TaskProgress | null };
  return payload?.data || null;
};
