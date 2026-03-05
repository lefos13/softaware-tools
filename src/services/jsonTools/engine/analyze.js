/*
  Analysis tools derive insights from JSON content without mutating semantic data,
  supporting filtering, counting, and duplicate detection workflows.
*/
import { JSONPath } from "jsonpath-plus";
import { parseJsonInput, formatPrettyJson, countObjects, stableStringify } from "./helpers";
import { ApiError } from "./types";

export const filterJson = (input, options) => {
  const parsed = parseJsonInput(input);
  const path = String(options.path || "$");

  try {
    const result = JSONPath({ path, json: parsed, wrap: true });
    return formatPrettyJson(result, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("INVALID_JSONPATH", "JSONPath expression is invalid", [
      { field: "path", issue: error instanceof Error ? error.message : "Invalid JSONPath" },
    ]);
  }
};

export const countJsonObjects = (input) => {
  const parsed = parseJsonInput(input);
  const objectCount = countObjects(parsed);
  const arrayCount = Array.isArray(parsed) ? parsed.length : 0;

  return `Object count: ${objectCount}\nTop-level array length: ${arrayCount}`;
};

export const findDuplicateJsonObjects = (input, options) => {
  const parsed = parseJsonInput(input);
  if (!Array.isArray(parsed)) {
    throw new ApiError("INVALID_JSON_ARRAY", "Input must be a JSON array", [
      { field: "input", issue: "Provide a JSON array" },
    ]);
  }

  const map = new Map();
  parsed.forEach((item, index) => {
    const key = stableStringify(item);
    const entry = map.get(key) || { item, indices: [] };
    entry.indices.push(index);
    map.set(key, entry);
  });

  const duplicates = Array.from(map.values())
    .filter((entry) => entry.indices.length > 1)
    .map((entry) => ({
      occurrences: entry.indices.length,
      indices: entry.indices,
      value: entry.item,
    }));

  if (options.outputMode === "summary") {
    return `Duplicate groups: ${duplicates.length}`;
  }

  return formatPrettyJson(duplicates, Number(options.indent || 2));
};
