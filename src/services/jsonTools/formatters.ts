/*
  Output formatting helpers centralize download metadata and text normalization
  so every tool can share identical copy and export behavior.
*/

export const buildDownloadName = (toolId: string, extension?: string): string => {
  const safeId = toolId.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeId}.${extension || "txt"}`;
};

export const normalizeTextOutput = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
};
