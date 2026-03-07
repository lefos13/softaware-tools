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

const parseApiErrorFromText = (status, rawText) => {
  try {
    const payload = JSON.parse(rawText);
    const code = payload?.error?.code;
    const message = payload?.error?.message || `Request failed with status ${status}`;
    const detailText = stringifyDetails(payload?.error?.details);
    const requestId = payload?.meta?.requestId;
    const withCode = code ? `${code}: ${message}` : message;
    const withDetails = detailText ? `${withCode} (${detailText})` : withCode;

    return requestId ? `${withDetails} [ref: ${requestId}]` : withDetails;
  } catch {
    return `Request failed with status ${status}`;
  }
};

const repairMojibakeFileName = (value) => {
  if (!/[ÎÏÃÐÑ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return repaired || value;
  } catch {
    return value;
  }
};

const normalizeHeaderFileName = (value) => {
  const cleaned = String(value || "").replace(/^"(.*)"$/, "$1");

  if (/%[0-9a-f]{2}/i.test(cleaned)) {
    try {
      return decodeURIComponent(cleaned);
    } catch {
      return repairMojibakeFileName(cleaned);
    }
  }

  return repairMojibakeFileName(cleaned);
};

export const unwrapFileName = (headers, fallback = "download.bin") => {
  const contentDisposition = headers.get("content-disposition") || "";
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return normalizeHeaderFileName(encodedMatch[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return (fileNameMatch?.[1] && normalizeHeaderFileName(fileNameMatch[1])) || fallback;
};

export const readOperationMessage = (headers, fallback) => {
  return headers.get("x-operation-message") || fallback;
};

export const readRequestId = (headers) => {
  return headers.get("x-request-id") || "";
};

// This helper exists so long-running uploads can expose live progress and ETA while still returning binary responses.
export const uploadMultipartBinary = ({ url, formData, onUploadProgress, headers = {} }) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "blob";
    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        xhr.setRequestHeader(key, String(value));
      }
    });

    xhr.upload.onprogress = (event) => {
      if (typeof onUploadProgress === "function" && event.lengthComputable) {
        onUploadProgress({
          loaded: event.loaded,
          total: event.total,
          ratio: event.total > 0 ? event.loaded / event.total : 0,
        });
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error while sending request"));
    };

    xhr.onload = async () => {
      const headers = {
        get: (name) => xhr.getResponseHeader(name),
      };

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          blob: xhr.response,
          headers,
          status: xhr.status,
        });
        return;
      }

      try {
        const rawText = await xhr.response.text();
        reject(new Error(parseApiErrorFromText(xhr.status, rawText)));
      } catch {
        reject(new Error(`Request failed with status ${xhr.status}`));
      }
    };

    xhr.send(formData);
  });
};
