// Task service polls backend task progress so UI can show real processing progress beyond upload completion.
import { buildUrl, parseApiError } from "./apiClient";

export const getTaskProgress = async (baseUrl, taskId) => {
  const response = await fetch(buildUrl(baseUrl, `/api/tasks/${encodeURIComponent(taskId)}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  return payload?.data || null;
};
