/*
  Admin report service tests verify token header propagation and superadmin
  invalidation request behavior alongside list/detail happy paths.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getFailureReport,
  invalidateAllAdminTokens,
  listAdminTokens,
  listFailureReports,
  revokeAdminTokens,
} from "./adminReportsService";

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  parseApiError: vi.fn(async () => "ADMIN_ERROR: could not fetch reports"),
}));

describe("adminReportsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists reports with safe integer limit and admin token header", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { count: 1, reports: [{ fileName: "one.json" }] } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await listFailureReports("http://localhost:3000", "adm-token", 120);
    expect(result).toEqual({ count: 1, reports: [{ fileName: "one.json" }] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/reports?limit=120",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-admin-token": "adm-token" }),
      })
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

    await expect(listFailureReports("http://localhost:3000", "tok", "bad")).resolves.toEqual({
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

    await expect(listFailureReports("http://localhost:3000", "bad-token")).rejects.toThrow(
      "ADMIN_ERROR: could not fetch reports"
    );
  });

  it("gets report detail by encoded file name with token header", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { report: { requestId: "req-1" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await getFailureReport("http://localhost:3000", "adm-token", "my report.json");
    expect(result).toEqual({ report: { requestId: "req-1" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/reports/my%20report.json",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-admin-token": "adm-token" }),
      })
    );
  });

  it("invalidates all admin tokens via superadmin endpoint", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { invalidated: 3 } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await invalidateAllAdminTokens("http://localhost:3000", "super-token");
    expect(result).toEqual({ invalidated: 3 });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/invalidate-all",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-admin-token": "super-token" }),
      })
    );
  });

  it("lists admin tokens for superadmin management", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { count: 2, tokens: [{ tokenId: "tok-1" }] } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await listAdminTokens("http://localhost:3000", "super-token");
    expect(result).toEqual({ count: 2, tokens: [{ tokenId: "tok-1" }] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-admin-token": "super-token" }),
      })
    );
  });

  it("revokes selected admin tokens via superadmin endpoint", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { revoked: 2, revokedTokenIds: ["tok-1", "tok-2"] } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await revokeAdminTokens("http://localhost:3000", "super-token", [
      "tok-1",
      "tok-2",
    ]);
    expect(result).toEqual({ revoked: 2, revokedTokenIds: ["tok-1", "tok-2"] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/revoke",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-admin-token": "super-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ tokenIds: ["tok-1", "tok-2"] }),
      })
    );
  });
});
