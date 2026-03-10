/*
  Token-management client tests pin the superadmin request headers and payload
  shapes so the tools portal stays aligned with the backend token API.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAccessToken,
  extendAccessToken,
  listAccessTokens,
  resetAccessTokenUsage,
  renewAccessToken,
  revokeAccessToken,
  updateAccessToken,
} from "./adminTokenService";

vi.mock("./apiClient", () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
  parseApiError: vi.fn(async () => "ADMIN_ERROR: request failed"),
}));

describe("adminTokenService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists access tokens with the superadmin header", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { count: 1, tokens: [{ tokenId: "tok-1" }] } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await listAccessTokens("http://localhost:3000", "super-token");
    expect(result).toEqual({ count: 1, tokens: [{ tokenId: "tok-1" }] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "x-admin-token": "super-token" }),
      })
    );
  });

  it("creates an access token with alias, ttl, and service policies", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { token: "sat_plain", record: { tokenId: "tok-2" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createAccessToken("http://localhost:3000", "super-token", {
      alias: "Books editor",
      servicePolicies: { books_greek_editor: "100000_words" },
      ttl: "30d",
    });

    expect(result).toEqual({ token: "sat_plain", record: { tokenId: "tok-2" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-admin-token": "super-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          alias: "Books editor",
          servicePolicies: { books_greek_editor: "100000_words" },
          ttl: "30d",
        }),
      })
    );
  });

  it("updates an existing access token", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { record: { tokenId: "tok-3", alias: "Updated" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await updateAccessToken("http://localhost:3000", "super-token", "tok-3", {
      alias: "Updated",
      servicePolicies: { books_greek_editor: "300000_words", pdf: "30_per_day" },
    });

    expect(result).toEqual({ record: { tokenId: "tok-3", alias: "Updated" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/tok-3",
      expect.objectContaining({
        method: "PATCH",
      })
    );
  });

  it("revokes an access token", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { record: { tokenId: "tok-4", isRevoked: true } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await revokeAccessToken("http://localhost:3000", "super-token", "tok-4");
    expect(result).toEqual({ record: { tokenId: "tok-4", isRevoked: true } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/tok-4/revoke",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("renews an access token with a ttl payload", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { token: "sat_new", record: { tokenId: "tok-5" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await renewAccessToken("http://localhost:3000", "super-token", "tok-5", "14d", {
      servicePolicies: { books_greek_editor: "300000_words" },
    });
    expect(result).toEqual({ token: "sat_new", record: { tokenId: "tok-5" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/tok-5/renew",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ttl: "14d",
          servicePolicies: { books_greek_editor: "300000_words" },
        }),
      })
    );
  });

  it("extends an access token with a ttl payload", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { record: { tokenId: "tok-6", expiresAt: "later" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await extendAccessToken("http://localhost:3000", "super-token", "tok-6", "7d");
    expect(result).toEqual({ record: { tokenId: "tok-6", expiresAt: "later" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/tok-6/extend",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ttl: "7d" }),
      })
    );
  });

  it("resets access token usage counters", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { record: { tokenId: "tok-7", usageResetAt: "now" } } }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await resetAccessTokenUsage("http://localhost:3000", "super-token", "tok-7");
    expect(result).toEqual({ record: { tokenId: "tok-7", usageResetAt: "now" } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/admin/tokens/tok-7/reset-usage",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-admin-token": "super-token" }),
      })
    );
  });
});
