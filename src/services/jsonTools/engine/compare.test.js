/*
  Compare tests validate equality checks, diff generation, and patch application
  for dual-input JSON workflows.
*/
import { describe, expect, it } from "vitest";
import { compareJson, diffJson, patchJson } from "./compare";

describe("jsonTools compare", () => {
  it("compares equivalent inputs", () => {
    const summary = compareJson('{"a":1,"b":2}', '{"b":2,"a":1}', { outputMode: "summary" });
    expect(summary).toContain("equivalent");
  });

  it("builds patch and delta diffs", () => {
    const patch = diffJson('{"a":1}', '{"a":2}', { mode: "patch", indent: 2 });
    expect(patch).toContain('"op": "replace"');

    const delta = diffJson('{"a":1}', '{"a":2}', { mode: "delta", indent: 2 });
    expect(delta).toContain('"a"');
  });

  it("applies json patch", () => {
    const output = patchJson('{"a":1}', '[{"op":"replace","path":"/a","value":3}]', { indent: 2 });
    expect(output).toContain('"a": 3');
  });
});
