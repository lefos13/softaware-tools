/*
  Option presets are derived from tool schemas so the workspace can initialize,
  reset, and render controls consistently for every JSON mini tool.
*/

import type { JsonToolDefinition, JsonToolOptions } from "../../types/jsonTools";

export const buildDefaultOptions = (
  tool: Pick<JsonToolDefinition, "optionsSchema"> | null | undefined
): JsonToolOptions => {
  const defaults: JsonToolOptions = {};
  (tool?.optionsSchema || []).forEach((field) => {
    defaults[field.key] = field.defaultValue;
  });
  return defaults;
};
