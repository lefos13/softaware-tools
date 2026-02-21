// Centralized response parsing was expanded so UI can display backend-provided messages, details, and request references consistently.
export const buildUrl = (baseUrl, path) => {
  const normalizedBase = (baseUrl || "").replace(/\/$/, "");
  return `${normalizedBase}${path}`;
};

const stringifyDetails = (details) => {
  if (!Array.isArray(details) || details.length === 0) {
    return "";
  }

  return details
    .map((detail) => {
      const field = detail?.field ? `${detail.field}: ` : "";
      return `${field}${detail?.issue || "Invalid value"}`;
    })
    .join(" | ");
};

export const parseApiError = async (response) => {
  try {
    const payload = await response.json();
    const code = payload?.error?.code;
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    const detailText = stringifyDetails(payload?.error?.details);
    const requestId = payload?.meta?.requestId;

    const withCode = code ? `${code}: ${message}` : message;
    const withDetails = detailText ? `${withCode} (${detailText})` : withCode;

    return requestId ? `${withDetails} [ref: ${requestId}]` : withDetails;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const unwrapFileName = (headers, fallback = "download.bin") => {
  const contentDisposition = headers.get("content-disposition") || "";
  const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  return fileNameMatch?.[1]?.replace(/"/g, "") || fallback;
};

export const readOperationMessage = (headers, fallback) => {
  return headers.get("x-operation-message") || fallback;
};

export const readRequestId = (headers) => {
  return headers.get("x-request-id") || "";
};
