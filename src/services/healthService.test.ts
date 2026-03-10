/*
  Health service tests ensure response mapping and error forwarding are stable,
  because API guard behavior depends directly on this helper.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import { getHealthStatus } from "./healthService";

vi.mock("./apiClient", () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
  parseApiError: vi.fn(async () => "API_DOWN: Service unavailable"),
}));

describe("healthService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns normalized health response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: { status: "ok" },
          message: "Healthy",
          meta: { requestId: "req-1" },
        }),
      }))
    );

    await expect(getHealthStatus("http://localhost:3000")).resolves.toEqual({
      status: "ok",
      message: "Healthy",
      requestId: "req-1",
    });
  });

  it("throws parsed api error when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
      }))
    );

    await expect(getHealthStatus("http://localhost:3000")).rejects.toThrow(
      "API_DOWN: Service unavailable"
    );
  });
});
