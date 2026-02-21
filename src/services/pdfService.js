// PDF service now supports live upload progress callbacks so merge flow can show real-time progress and ETA.
import {
  buildUrl,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";

export const mergePdfFiles = async (baseUrl, files, mergePlan = [], options = {}) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  if (Array.isArray(mergePlan) && mergePlan.length > 0) {
    formData.append("mergePlan", JSON.stringify(mergePlan));
  }

  const response = await uploadMultipartBinary({
    url: buildUrl(baseUrl, "/api/pdf/merge"),
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "merged.pdf"),
    message: readOperationMessage(response.headers, "PDF files merged successfully"),
    requestId: readRequestId(response.headers),
  };
};
