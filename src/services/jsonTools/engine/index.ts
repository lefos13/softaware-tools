/*
  Central JSON tool executor routes tool ids to deterministic handlers and
  normalizes return payloads for the shared workspace UI.
*/
import type {
  JsonToolExecutionContext,
  JsonToolHandler,
  JsonToolRunRequest,
  JsonToolRunResult,
} from "../../../types/jsonTools";
import {
  convertBase64ToJson,
  convertBsonToJson,
  convertCsvToJson,
  convertJsonToBase64,
  convertJsonToBson,
  convertJsonToCsv,
  convertJsonToSqlInsert,
  convertJsonToSqlQuery,
  convertJsonToXml,
  convertJsonToYaml,
  convertSqlInsertToJson,
  convertXmlToJson,
  convertYamlToJson,
} from "./conversion";
import {
  beautifyJson,
  decodeJson,
  encodeJson,
  jsonEscape,
  jsonStripslashes,
  jsonUnescape,
  minifyJson,
  obfuscateJson,
  redactJson,
  repairJson,
  sortJson,
  stringifyJson,
  validateJson,
} from "./formatting";
import { countJsonObjects, filterJson, findDuplicateJsonObjects } from "./analyze";
import { compareJson, diffJson, patchJson } from "./compare";
import { flattenJson, unflattenJson } from "./structure";
import { normalizeToolError } from "./helpers";

const handlers: Record<string, JsonToolHandler> = {
  "beautify-json": (ctx) => beautifyJson(ctx.input, ctx.options),
  "minify-json": (ctx) => minifyJson(ctx.input),
  "validate-json": (ctx) => validateJson(ctx.input, ctx.options),
  "json-to-yaml": (ctx) => convertJsonToYaml(ctx.input, ctx.options),
  "yaml-to-json": (ctx) => convertYamlToJson(ctx.input, ctx.options),
  "json-to-xml": (ctx) => convertJsonToXml(ctx.input, ctx.options),
  "xml-to-json": (ctx) => convertXmlToJson(ctx.input, ctx.options),
  "json-to-csv": (ctx) => convertJsonToCsv(ctx.input),
  "csv-to-json": (ctx) => convertCsvToJson(ctx.input, ctx.options),
  "json-to-sql-insert": (ctx) => convertJsonToSqlInsert(ctx.input, ctx.options),
  "sql-insert-to-json": (ctx) => convertSqlInsertToJson(ctx.input, ctx.options),
  "json-to-sql-query": (ctx) => convertJsonToSqlQuery(ctx.input, ctx.options),
  "json-to-base64": (ctx) => convertJsonToBase64(ctx.input),
  "base64-to-json": (ctx) => convertBase64ToJson(ctx.input, ctx.options),
  "json-to-bson": (ctx) => convertJsonToBson(ctx.input),
  "bson-to-json": (ctx) => convertBsonToJson(ctx.input, ctx.options),
  "json-stringify": (ctx) => stringifyJson(ctx.input),
  "json-stripslashes": (ctx) => jsonStripslashes(ctx.input),
  "json-escape": (ctx) => jsonEscape(ctx.input),
  "json-unescape": (ctx) => jsonUnescape(ctx.input),
  "sort-json": (ctx) => sortJson(ctx.input, ctx.options),
  "filter-json": (ctx) => filterJson(ctx.input, ctx.options),
  "count-json-objects": (ctx) => countJsonObjects(ctx.input),
  "find-duplicate-json-objects": (ctx) => findDuplicateJsonObjects(ctx.input, ctx.options),
  "compare-json": (ctx) => compareJson(ctx.input, ctx.secondaryInput, ctx.options),
  "diff-json": (ctx) => diffJson(ctx.input, ctx.secondaryInput, ctx.options),
  "patch-json": (ctx) => patchJson(ctx.input, ctx.secondaryInput, ctx.options),
  "flatten-json": (ctx) => flattenJson(ctx.input, ctx.options),
  "unflatten-json": (ctx) => unflattenJson(ctx.input, ctx.options),
  "repair-json": (ctx) => repairJson(ctx.input, ctx.options),
  "redact-json": (ctx) => redactJson(ctx.input, ctx.options),
  "obfuscate-json": (ctx) => obfuscateJson(ctx.input, ctx.options),
  "encode-json": (ctx) => encodeJson(ctx.input, ctx.options),
  "decode-json": (ctx) => decodeJson(ctx.input, ctx.options),
};

const textExtensions: Record<string, string> = {
  "json-to-yaml": "yaml",
  "json-to-xml": "xml",
  "json-to-csv": "csv",
  "json-to-sql-insert": "sql",
  "json-to-sql-query": "sql",
  "json-to-base64": "txt",
  "json-to-bson": "txt",
  "encode-json": "txt",
  "json-stringify": "txt",
  "json-escape": "txt",
  "json-stripslashes": "txt",
};

export const runJsonTool = ({
  toolId,
  input,
  secondaryInput = "",
  options = {},
}: JsonToolRunRequest): JsonToolRunResult => {
  const execute = handlers[toolId];
  if (!execute) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_TOOL",
        message: `Unknown JSON tool: ${toolId}`,
        details: [],
      },
    };
  }

  try {
    const output = execute({ input, secondaryInput, options } as JsonToolExecutionContext);
    return {
      ok: true,
      outputText: typeof output === "string" ? output : JSON.stringify(output, null, 2),
      extension: textExtensions[toolId] || "json",
      mimeType: textExtensions[toolId] === "csv" ? "text/csv" : "text/plain",
    };
  } catch (error) {
    return {
      ok: false,
      error: normalizeToolError(error),
    };
  }
};
