/*
  Registry tests enforce catalog integrity so every JSON service tool is
  addressable and routed through a valid definition.
*/
import { describe, expect, it } from "vitest";
import { JSON_TOOL_BY_ID, JSON_TOOLS } from "./registry";

describe("jsonTools registry", () => {
  it("includes all expected tool definitions", () => {
    expect(JSON_TOOLS.length).toBe(36);
    expect(JSON_TOOL_BY_ID["beautify-json"]).toBeDefined();
    expect(JSON_TOOL_BY_ID["screenshot-json"]).toBeDefined();
  });

  it("ensures unique ids", () => {
    const ids = JSON_TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
