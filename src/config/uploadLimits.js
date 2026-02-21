// This shared limit config keeps frontend upload guards aligned with backend constraints to prevent avoidable oversized requests.
const toInt = (rawValue, fallback) => {
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const MAX_UPLOAD_FILES = toInt(import.meta.env.VITE_MAX_UPLOAD_FILES, 20);
export const MAX_FILE_SIZE_MB = toInt(import.meta.env.VITE_MAX_FILE_SIZE_MB, 25);
export const MAX_TOTAL_UPLOAD_MB = toInt(import.meta.env.VITE_MAX_TOTAL_UPLOAD_MB, 120);

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_MB * 1024 * 1024;
