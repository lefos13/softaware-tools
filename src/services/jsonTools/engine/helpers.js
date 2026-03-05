/*
  Shared parsing and formatting helpers enforce deterministic JSON processing
  and consistent error messages across all JSON mini tools.
*/
import { ApiError } from "./types";

export const normalizeToolError = (error, fallbackCode = "JSON_TOOL_ERROR") => {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details || [],
    };
  }

  return {
    code: fallbackCode,
    message: error instanceof Error ? error.message : "Unexpected JSON tool error",
    details: [],
  };
};

export const parseJsonInput = (value, field = "input") => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new ApiError("INVALID_JSON", `Invalid JSON in ${field}`, [
      {
        field,
        issue: error instanceof Error ? error.message : "Could not parse JSON",
      },
    ]);
  }
};

export const parseJsonObjectInput = (value, field = "input") => {
  const parsed = parseJsonInput(value, field);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ApiError("INVALID_JSON_OBJECT", `${field} must be a JSON object`, [
      { field, issue: "Provide a JSON object" },
    ]);
  }

  return parsed;
};

export const formatPrettyJson = (value, indent = 2) => JSON.stringify(value, null, indent);

export const formatMinifiedJson = (value) => JSON.stringify(value);

export const stableStringify = (value) => {
  const walk = (node) => {
    if (Array.isArray(node)) {
      return `[${node.map((item) => walk(item)).join(",")}]`;
    }

    if (node && typeof node === "object") {
      const keys = Object.keys(node).sort();
      const pairs = keys.map((key) => `${JSON.stringify(key)}:${walk(node[key])}`);
      return `{${pairs.join(",")}}`;
    }

    return JSON.stringify(node);
  };

  return walk(value);
};

export const flattenObject = (value, parent = "", separator = ".", target = {}) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const nextKey = parent ? `${parent}${separator}${index}` : String(index);
      flattenObject(item, nextKey, separator, target);
    });
    return target;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => {
      const nextKey = parent ? `${parent}${separator}${key}` : key;
      flattenObject(child, nextKey, separator, target);
    });
    return target;
  }

  target[parent] = value;
  return target;
};

export const unflattenObject = (value, separator = ".") => {
  const output = {};

  Object.entries(value).forEach(([compoundKey, nodeValue]) => {
    const segments = compoundKey.split(separator).filter(Boolean);
    if (segments.length === 0) {
      return;
    }

    let cursor = output;

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      const nextSegment = segments[index + 1];
      const nextIsIndex = /^\d+$/.test(nextSegment || "");
      const currentIsIndex = /^\d+$/.test(segment);

      if (isLast) {
        if (currentIsIndex && Array.isArray(cursor)) {
          cursor[Number(segment)] = nodeValue;
        } else {
          cursor[segment] = nodeValue;
        }
        return;
      }

      if (currentIsIndex && Array.isArray(cursor)) {
        if (cursor[Number(segment)] === undefined) {
          cursor[Number(segment)] = nextIsIndex ? [] : {};
        }
        cursor = cursor[Number(segment)];
        return;
      }

      if (cursor[segment] === undefined) {
        cursor[segment] = nextIsIndex ? [] : {};
      }

      cursor = cursor[segment];
    });
  });

  return output;
};

export const countObjects = (value) => {
  let count = 0;

  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (node && typeof node === "object") {
      count += 1;
      Object.values(node).forEach(visit);
    }
  };

  visit(value);
  return count;
};

export const parseCsvValue = (value) => {
  if (value === "") {
    return "";
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value === "null") {
    return null;
  }

  if (!Number.isNaN(Number(value)) && value.trim() !== "") {
    return Number(value);
  }

  return value;
};
