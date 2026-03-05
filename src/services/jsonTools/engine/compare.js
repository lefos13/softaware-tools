/*
  Compare tools evaluate similarity and patchability between two JSON documents,
  supporting deep equality checks, diff generation, and patch application.
*/
import { compare as comparePatch, applyPatch } from "fast-json-patch";
import { diff as jsonDiff } from "jsondiffpatch";
import { parseJsonInput, formatPrettyJson, stableStringify } from "./helpers";

export const compareJson = (input, secondaryInput, options) => {
  const left = parseJsonInput(input, "primaryInput");
  const right = parseJsonInput(secondaryInput, "secondaryInput");

  const equal = stableStringify(left) === stableStringify(right);
  if (options.outputMode === "summary") {
    return equal ? "JSON inputs are equivalent" : "JSON inputs are different";
  }

  return formatPrettyJson(
    {
      equal,
      leftType: Array.isArray(left) ? "array" : typeof left,
      rightType: Array.isArray(right) ? "array" : typeof right,
    },
    Number(options.indent || 2)
  );
};

export const diffJson = (input, secondaryInput, options) => {
  const left = parseJsonInput(input, "primaryInput");
  const right = parseJsonInput(secondaryInput, "secondaryInput");

  const mode = String(options.mode || "patch");
  if (mode === "delta") {
    const delta = jsonDiff(left, right);
    return formatPrettyJson(delta || {}, Number(options.indent || 2));
  }

  const patch = comparePatch(left, right);
  return formatPrettyJson(patch, Number(options.indent || 2));
};

export const patchJson = (input, secondaryInput, options) => {
  const documentValue = parseJsonInput(input, "primaryInput");
  const patch = parseJsonInput(secondaryInput, "secondaryInput");
  const result = applyPatch(documentValue, patch, true, false).newDocument;
  return formatPrettyJson(result, Number(options.indent || 2));
};
