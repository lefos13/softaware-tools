// PDF service now sends merge-plan instructions so backend can apply frontend-selected order and rotation rules.
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
} from "./apiClient";

export const mergePdfFiles = async (baseUrl, files, mergePlan = []) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  if (Array.isArray(mergePlan) && mergePlan.length > 0) {
    formData.append("mergePlan", JSON.stringify(mergePlan));
  }

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
