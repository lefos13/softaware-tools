/*
  Structure tools transform object shape predictably for downstream systems,
  including flattening and reconstruction of nested document paths.
*/
import type { JsonToolOptions } from "../../../types/jsonTools";
import {
  parseJsonInput,
  parseJsonObjectInput,
  flattenObject,
  unflattenObject,
  formatPrettyJson,
} from "./helpers";
import { ApiError } from "./types";

export const flattenJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  if (!parsed || typeof parsed !== "object") {
    throw new ApiError("INVALID_JSON_OBJECT", "Input must be a JSON object or array", [
      { field: "input", issue: "Provide object-like JSON" },
    ]);
  }

  const separator = String(options.separator || ".");
  const flattened = flattenObject(parsed, "", separator, {});
  return formatPrettyJson(flattened, Number(options.indent || 2));
};

export const unflattenJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonObjectInput(input);
  const separator = String(options.separator || ".");
  const unflattened = unflattenObject(parsed, separator);
  return formatPrettyJson(unflattened, Number(options.indent || 2));
};
