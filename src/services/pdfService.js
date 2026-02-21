// PDF service now exposes backend success headers so UI can show operation feedback and support reference IDs after download.
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
} from "./apiClient";

export const mergePdfFiles = async (baseUrl, files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(buildUrl(baseUrl, "/api/pdf/merge"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const blob = await response.blob();
  return {
    blob,
    fileName: unwrapFileName(response.headers, "merged.pdf"),
    message: readOperationMessage(response.headers, "PDF files merged successfully"),
    requestId: readRequestId(response.headers),
  };
};
