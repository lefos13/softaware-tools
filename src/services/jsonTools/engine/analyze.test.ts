/*
  Analyze tests ensure filtering, counting, and duplicate detection provide
  consistent outputs for diagnostics and data-quality workflows.
*/
import { describe, expect, it } from "vitest";
import { countJsonObjects, filterJson, findDuplicateJsonObjects } from "./analyze";

describe("jsonTools analyze", () => {
  it("filters by jsonpath", () => {
    const output = filterJson('{"users":[{"id":1},{"id":2}]}', {
      path: "$.users[*].id",
      indent: 2,
    });
    expect(output).toContain("1");
    expect(output).toContain("2");
  });

  it("counts object nodes", () => {
    const text = countJsonObjects('{"a":{"b":1},"list":[{"c":2}]}');
    expect(text).toContain("Object count:");
  });

  it("finds duplicates in array input", () => {
    const details = findDuplicateJsonObjects('[{"id":1},{"id":1},{"id":2}]', {
      outputMode: "details",
      indent: 2,
    });
    expect(details).toContain('"occurrences": 2');

    const summary = findDuplicateJsonObjects('[{"id":1},{"id":1}]', { outputMode: "summary" });
    expect(summary).toContain("Duplicate groups");
  });
});
