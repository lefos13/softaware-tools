// PDF service now forwards task ids as query params so backend progress tracking works without custom-header transport issues.
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

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/merge")}${taskIdSuffix}`,
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
