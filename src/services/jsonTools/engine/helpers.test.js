/*
  Helper tests cover shared parsing, flattening, and counting behavior because
  multiple JSON tools depend on these primitives.
*/
import { describe, expect, it } from "vitest";
import {
  countObjects,
  flattenObject,
  parseCsvValue,
  parseJsonInput,
  parseJsonObjectInput,
  stableStringify,
  unflattenObject,
} from "./helpers";

describe("jsonTools helpers", () => {
  it("parses valid json and rejects invalid json", () => {
    expect(parseJsonInput('{"a":1}')).toEqual({ a: 1 });
    expect(() => parseJsonInput("{bad}")).toThrow("Invalid JSON in input");
  });

  it("enforces object input when required", () => {
    expect(parseJsonObjectInput('{"a":1}')).toEqual({ a: 1 });
    expect(() => parseJsonObjectInput("[1,2]")).toThrow("must be a JSON object");
  });

  it("flattens and unflattens nested structures", () => {
    const source = { a: { b: 1 }, c: ["x", "y"] };
    const flattened = flattenObject(source, "", ".", {});
    expect(flattened).toEqual({ "a.b": 1, "c.0": "x", "c.1": "y" });

    const rebuilt = unflattenObject(flattened, ".");
    expect(rebuilt).toEqual(source);
  });

  it("counts object nodes recursively", () => {
    expect(countObjects({ a: { b: 1 }, c: [{ d: 2 }] })).toBe(3);
  });

  it("normalizes primitive csv values", () => {
    expect(parseCsvValue("42")).toBe(42);
    expect(parseCsvValue("true")).toBe(true);
    expect(parseCsvValue("null")).toBeNull();
    expect(parseCsvValue("hello")).toBe("hello");
  });

  it("stableStringify produces deterministic ordering", () => {
    const left = stableStringify({ b: 2, a: 1 });
    const right = stableStringify({ a: 1, b: 2 });
    expect(left).toBe(right);
  });
});
