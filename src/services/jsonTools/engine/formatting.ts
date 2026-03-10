/*
  Formatting tools normalize JSON text representation and provide quick
  text-escaping utilities commonly used in API payload workflows.
*/
import { jsonrepair } from "jsonrepair";
import type { JsonObject, JsonToolOptions, JsonValue } from "../../../types/jsonTools";
import {
  parseJsonInput,
  formatPrettyJson,
  formatMinifiedJson,
  parseJsonObjectInput,
} from "./helpers";
import { ApiError } from "./types";

export const beautifyJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  return formatPrettyJson(parsed, Number(options.indent || 2));
};

export const minifyJson = (input: string): string => {
  const parsed = parseJsonInput(input);
  return formatMinifiedJson(parsed);
};

export const validateJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  const mode = String(options.mode || "message");

  if (mode === "normalized") {
    return formatPrettyJson(parsed, Number(options.indent || 2));
  }

  return "Valid JSON";
};

export const stringifyJson = (input: string): string => JSON.stringify(input);

export const jsonStripslashes = (input: string): string => input.replace(/\\+/g, "");

export const jsonEscape = (input: string): string => JSON.stringify(input).slice(1, -1);

export const jsonUnescape = (input: string): string => {
  try {
    return JSON.parse(`"${input.replace(/"/g, '\\"')}"`);
  } catch (error) {
    throw new ApiError("INVALID_ESCAPED_JSON", "Input could not be unescaped", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid escaped string" },
    ]);
  }
};

const sortNode = (value: JsonValue, arrayMode: string): JsonValue => {
  if (Array.isArray(value)) {
    const mapped = value.map((item) => sortNode(item, arrayMode));
    if (arrayMode === "asc") {
      return mapped.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }
    if (arrayMode === "desc") {
      return mapped.sort((a, b) => JSON.stringify(b).localeCompare(JSON.stringify(a)));
    }
    return mapped;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sorted: JsonObject = {};
  Object.keys(value)
    .sort()
    .forEach((key) => {
      sorted[key] = sortNode(value[key], arrayMode);
    });

  return sorted;
};

export const sortJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  const sorted = sortNode(parsed, String(options.arraySortMode || "none"));
  return formatPrettyJson(sorted, Number(options.indent || 2));
};

export const repairJson = (input: string, options: JsonToolOptions): string => {
  try {
    const repaired = jsonrepair(input);
    if (options.outputMode === "raw") {
      return repaired;
    }

    const parsed = parseJsonInput(repaired, "repaired");
    return formatPrettyJson(parsed, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("JSON_REPAIR_FAILED", "JSON repair failed", [
      { field: "input", issue: error instanceof Error ? error.message : "Could not repair JSON" },
    ]);
  }
};

export const redactJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  const replacement = String(options.replacement || "[REDACTED]");
  const redactKeys = String(options.keys || "password,token,secret")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const visit = (node: JsonValue): JsonValue => {
    if (Array.isArray(node)) {
      return node.map(visit);
    }

    if (!node || typeof node !== "object") {
      return node;
    }

    const mapped: JsonObject = {};
    Object.entries(node).forEach(([key, value]) => {
      if (redactKeys.includes(key)) {
        mapped[key] = replacement;
      } else {
        mapped[key] = visit(value);
      }
    });

    return mapped;
  };

  return formatPrettyJson(visit(parsed), Number(options.indent || 2));
};

export const obfuscateJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  const mode = String(options.mode || "mask");

  const scrambleText = (value: string): string => {
    if (mode === "reverse") {
      return value.split("").reverse().join("");
    }

    if (mode === "hash") {
      return btoa(value).slice(0, 16);
    }

    return "*".repeat(Math.max(value.length, 4));
  };

  const visit = (node: JsonValue): JsonValue => {
    if (Array.isArray(node)) {
      return node.map(visit);
    }

    if (node && typeof node === "object") {
      const out: JsonObject = {};
      Object.entries(node).forEach(([key, value]) => {
        out[key] = visit(value);
      });
      return out;
    }

    if (typeof node === "string") {
      return scrambleText(node);
    }

    if (typeof node === "number") {
      return 0;
    }

    return node;
  };

  return formatPrettyJson(visit(parsed), Number(options.indent || 2));
};

export const encodeJson = (input: string, options: JsonToolOptions): string => {
  const parsed = parseJsonInput(input);
  const mode = String(options.mode || "base64");
  const raw = formatMinifiedJson(parsed);

  if (mode === "uri") {
    return encodeURIComponent(raw);
  }

  if (mode === "hex") {
    return Array.from(raw)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  }

  return btoa(unescape(encodeURIComponent(raw)));
};

export const decodeJson = (input: string, options: JsonToolOptions): string => {
  const mode = String(options.mode || "base64");
  let decoded: string;

  try {
    if (mode === "uri") {
      decoded = decodeURIComponent(input);
    } else if (mode === "hex") {
      const chars = input.match(/.{1,2}/g) || [];
      decoded = chars.map((hex) => String.fromCharCode(Number.parseInt(hex, 16))).join("");
    } else {
      decoded = decodeURIComponent(escape(atob(input.trim())));
    }
  } catch (error) {
    throw new ApiError("DECODE_FAILED", "Could not decode input", [
      { field: "input", issue: error instanceof Error ? error.message : "Decoding failed" },
    ]);
  }

  const parsed = parseJsonInput(decoded, "decoded");
  return formatPrettyJson(parsed, Number(options.indent || 2));
};

export const jsonToSqlQueryObject = (input: string): JsonObject => parseJsonObjectInput(input);
