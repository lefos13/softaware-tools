/*
  Formatter tests protect common output naming and text normalization helpers
  used by JSON workspace download/copy flows.
*/
import { describe, expect, it } from "vitest";
import { buildDownloadName, normalizeTextOutput } from "./formatters";

describe("jsonTools formatters", () => {
  it("builds safe download names", () => {
    expect(buildDownloadName("JSON Tool", "txt")).toBe("json-tool.txt");
  });

  it("normalizes output to text", () => {
    expect(normalizeTextOutput("hello")).toBe("hello");
    expect(normalizeTextOutput({ a: 1 })).toContain('"a": 1');
  });
});
