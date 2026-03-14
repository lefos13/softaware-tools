/*
  Access-plan client tests keep the plans catalog and public token-request
  submission aligned with backend response envelopes and error parsing.
*/
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAccessPlanCatalog, submitTokenRequest } from "./accessPlanService";

vi.mock("./apiClient", () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
  parseApiError: vi.fn(async () => "ACCESS_ERROR: request failed"),
}));

vi.mock("./accessClientState", () => ({
  readActiveServiceToken: () => "",
}));

describe("accessPlanService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the public access plan catalog", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: { freePlan: { planType: "free", services: [] }, premiumPlans: [] },
      }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchAccessPlanCatalog("http://localhost:3000");
    expect(result).toEqual({ freePlan: { planType: "free", services: [] }, premiumPlans: [] });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/access/catalog",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("submits a token request", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          request: {
            requestId: "req-1",
            status: "pending",
            pricing: {
              totalAmount: 119,
              currency: "EUR",
              billingMode: "one_time",
              items: [],
            },
          },
        },
      }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const payload = {
      alias: "Editorial team",
      email: "editor@example.com",
      servicePolicies: { books_greek_editor: "300000_words" },
    };
    const result = await submitTokenRequest("http://localhost:3000", payload);

    expect(result).toEqual({
      request: {
        requestId: "req-1",
        status: "pending",
        pricing: {
          totalAmount: 119,
          currency: "EUR",
          billingMode: "one_time",
          items: [],
        },
      },
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3000/api/access/token-requests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
