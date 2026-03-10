/*
  Structure tests verify flatten and unflatten transformations preserve value
  semantics for nested payloads.
*/
import { describe, expect, it } from "vitest";
import { flattenJson, unflattenJson } from "./structure";

describe("jsonTools structure", () => {
  it("flattens nested json", () => {
    const output = flattenJson('{"a":{"b":1}}', { separator: ".", indent: 2 });
    expect(output).toContain('"a.b": 1');
  });

  it("unflattens path-based json", () => {
    const output = unflattenJson('{"a.b":1,"a.c":2}', { separator: ".", indent: 2 });
    expect(output).toContain('"b": 1');
    expect(output).toContain('"c": 2');
  });
});
