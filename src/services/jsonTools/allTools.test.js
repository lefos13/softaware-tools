/*
  This suite verifies every JSON tool definition one-by-one with representative
  inputs so regressions are caught across the full catalog, not just sampled tools.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSON_TOOLS } from "./registry";
import { buildDefaultOptions } from "./presets";
import { runJsonTool } from "./engine/index";
import { convertJsonToBson } from "./engine/conversion";
import { renderJsonAsImage } from "./visual";

const baseJson = '{"a":1,"b":"text","arr":[1,2],"nested":{"token":"abc"}}';
const altJson = '{"a":2,"b":"text","arr":[1,3],"nested":{"token":"xyz"}}';
const arrayJson = '[{"id":1,"name":"Alice"},{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]';
const patchJson = '[{"op":"replace","path":"/a","value":3}]';
const csvText = "name,age\nAlice,30";
const yamlText = "a: 1\nb: text";
const xmlText = "<root><a>1</a><b>text</b></root>";
const sqlInsertText = "INSERT INTO users (id, name) VALUES (1, 'Alice');";
const base64Json = "eyJhIjoxLCJiIjoidGV4dCJ9";
const malformedJson = '{name:"Alice", age: 30}';

const inputByTool = {
  "beautify-json": () => ({ input: baseJson }),
  "minify-json": () => ({ input: baseJson }),
  "validate-json": () => ({ input: baseJson }),
  "json-to-yaml": () => ({ input: baseJson }),
  "yaml-to-json": () => ({ input: yamlText }),
  "json-to-xml": () => ({ input: baseJson }),
  "xml-to-json": () => ({ input: xmlText }),
  "json-to-csv": () => ({ input: arrayJson }),
  "csv-to-json": () => ({ input: csvText }),
  "json-to-sql-insert": () => ({ input: arrayJson }),
  "sql-insert-to-json": () => ({ input: sqlInsertText }),
  "json-to-sql-query": () => ({ input: '{"id":1,"status":"active"}' }),
  "json-to-base64": () => ({ input: baseJson }),
  "base64-to-json": () => ({ input: base64Json }),
  "json-to-bson": () => ({ input: baseJson }),
  "bson-to-json": () => ({ input: convertJsonToBson(baseJson) }),
  "json-stringify": () => ({ input: "hello world" }),
  "json-stripslashes": () => ({ input: "a\\\\b\\\\c" }),
  "json-escape": () => ({ input: 'hello "json"' }),
  "json-unescape": () => ({ input: "hello \\\\n world" }),
  "sort-json": () => ({ input: '{"z":1,"a":2,"arr":[2,1]}' }),
  "filter-json": () => ({ input: baseJson, options: { path: "$" } }),
  "count-json-objects": () => ({ input: baseJson }),
  "find-duplicate-json-objects": () => ({ input: arrayJson }),
  "compare-json": () => ({ input: baseJson, secondaryInput: altJson }),
  "diff-json": () => ({ input: baseJson, secondaryInput: altJson }),
  "patch-json": () => ({ input: baseJson, secondaryInput: patchJson }),
  "flatten-json": () => ({ input: baseJson }),
  "unflatten-json": () => ({ input: '{"nested.token":"abc","arr.0":1,"arr.1":2}' }),
  "repair-json": () => ({ input: malformedJson }),
  "redact-json": () => ({ input: baseJson }),
  "obfuscate-json": () => ({ input: baseJson }),
  "encode-json": () => ({ input: baseJson }),
  "decode-json": () => ({ input: base64Json }),
};

const isVisualTool = (toolId) => toolId === "json-to-image" || toolId === "screenshot-json";

describe("jsonTools exhaustive verification", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url");

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          closePath: vi.fn(),
          fillRect: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          measureText: (text) => ({ width: String(text).length * 7 }),
          fillText: vi.fn(),
        }),
        toBlob: (cb) => cb(new Blob(["png"], { type: "image/png" })),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    createObjectURL.mockClear();
  });

  JSON_TOOLS.forEach((tool) => {
    it(`runs ${tool.id} successfully`, async () => {
      const defaults = buildDefaultOptions(tool);

      if (isVisualTool(tool.id)) {
        const visualResult = await renderJsonAsImage({
          toolId: tool.id,
          input: baseJson,
          options: defaults,
        });

        expect(visualResult.outputBlob).toBeInstanceOf(Blob);
        expect(visualResult.outputUrl).toBe("blob:mock-url");
        return;
      }

      const factory = inputByTool[tool.id] || (() => ({ input: baseJson }));
      const testInput = factory();

      const result = runJsonTool({
        toolId: tool.id,
        input: testInput.input,
        secondaryInput: testInput.secondaryInput || "",
        options: {
          ...defaults,
          ...(testInput.options || {}),
        },
      });

      expect(result.ok).toBe(true);
      expect(typeof result.outputText).toBe("string");
      expect(result.outputText.length).toBeGreaterThan(0);
    });
  });
});
