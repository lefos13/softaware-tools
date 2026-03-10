/*
  Engine index tests confirm registry dispatch routes tool ids to handlers and
  returns normalized success/error payloads.
*/
import { describe, expect, it } from "vitest";
import { runJsonTool } from "./index";

describe("jsonTools engine index", () => {
  it("returns success payload for known tool", () => {
    const result = runJsonTool({
      toolId: "beautify-json",
      input: '{"a":1}',
      options: { indent: 2 },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputText).toContain('"a": 1');
      expect(result.extension).toBe("json");
    }
  });

  it("returns normalized error for invalid input", () => {
    const result = runJsonTool({
      toolId: "beautify-json",
      input: "{bad}",
      options: { indent: 2 },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_JSON");
    }
  });

  it("returns unknown-tool error for unknown id", () => {
    const result = runJsonTool({ toolId: "missing-tool", input: "{}", options: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN_TOOL");
    }
  });
});
