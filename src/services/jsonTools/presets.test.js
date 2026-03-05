/*
  Preset tests guarantee option default derivation stays in sync with tool
  schemas, which drives reset and initial state behavior.
*/
import { describe, expect, it } from "vitest";
import { buildDefaultOptions } from "./presets";

describe("jsonTools presets", () => {
  it("builds default option object from schema", () => {
    const defaults = buildDefaultOptions({
      optionsSchema: [
        { key: "indent", defaultValue: 2 },
        { key: "mode", defaultValue: "patch" },
      ],
    });

    expect(defaults).toEqual({ indent: 2, mode: "patch" });
  });
});
