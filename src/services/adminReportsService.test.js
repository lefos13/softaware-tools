/*
  Admin reports tests verify list/detail request construction and fallback payloads
  so operational diagnostics screens remain reliable.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFailureReport, listFailureReports } from "./adminReportsService";

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  parseApiError: vi.fn(async () => "ADMIN_ERROR: could not fetch reports"),
}));

describe("adminReportsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists reports with safe integer limit", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { count: 1, reports: [{ fileName: "one.json" }] } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await listFailureReports("http://localhost:3000", 120);
    expect(result).toEqual({ count: 1, reports: [{ fileName: "one.json" }] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/reports?limit=120",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("falls back to default payload when data is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
      }))
    );

    await expect(listFailureReports("http://localhost:3000", "bad")).resolves.toEqual({
      count: 0,
      reports: [],
    });
  });

  it("throws parsed error when list request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
      }))
    );

    await expect(listFailureReports("http://localhost:3000")).rejects.toThrow(
      "ADMIN_ERROR: could not fetch reports"
    );
  });

  it("gets report detail by encoded file name", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { report: { requestId: "req-1" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getFailureReport("http://localhost:3000", "my report.json");
    expect(result).toEqual({ report: { requestId: "req-1" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/reports/my%20report.json",
      expect.objectContaining({ method: "GET" })
    );
  });
});
