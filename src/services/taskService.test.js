/*
  Task service tests protect progress polling behavior, including null-on-404
  semantics used by UI fallbacks.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import { getTaskProgress } from "./taskService";

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  parseApiError: vi.fn(async () => "TASK_ERROR: could not load task"),
}));

describe("taskService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns null for 404 task lookup", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 404,
        ok: false,
      }))
    );

    await expect(getTaskProgress("http://localhost:3000", "task-1")).resolves.toBeNull();
  });

  it("throws parsed api error for non-404 failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 500,
        ok: false,
      }))
    );

    await expect(getTaskProgress("http://localhost:3000", "task-1")).rejects.toThrow(
      "TASK_ERROR: could not load task"
    );
  });

  it("returns task data when request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        ok: true,
        json: async () => ({ data: { progress: 55 } }),
      }))
    );

    await expect(getTaskProgress("http://localhost:3000", "task-1")).resolves.toEqual({
      progress: 55,
    });
  });
});
