/*
  Upload guards read the same numeric environment settings as the backend
  contract notes, so these helpers normalize optional string env values into
  stable numeric limits before every tool flow consumes them.
*/
const toInt = (rawValue: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const MAX_UPLOAD_FILES = toInt(import.meta.env.VITE_MAX_UPLOAD_FILES, 20);
export const MAX_FILE_SIZE_MB = toInt(import.meta.env.VITE_MAX_FILE_SIZE_MB, 25);
export const MAX_TOTAL_UPLOAD_MB = toInt(import.meta.env.VITE_MAX_TOTAL_UPLOAD_MB, 120);

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = MAX_TOTAL_UPLOAD_MB * 1024 * 1024;
