/*
  Option presets are derived from tool schemas so the workspace can initialize,
  reset, and render controls consistently for every JSON mini tool.
*/

export const buildDefaultOptions = (tool) => {
  const defaults = {};
  (tool?.optionsSchema || []).forEach((field) => {
    defaults[field.key] = field.defaultValue;
  });
  return defaults;
};
