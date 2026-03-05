/*
  Output formatting helpers centralize download metadata and text normalization
  so every tool can share identical copy and export behavior.
*/

export const buildDownloadName = (toolId, extension) => {
  const safeId = toolId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeId}.${extension || "txt"}`;
};

export const normalizeTextOutput = (value) => {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
};
