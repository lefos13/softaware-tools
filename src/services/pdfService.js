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

export const splitPdfFile = async (baseUrl, file, mode, splitOptions = {}, options = {}) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("mode", mode);
  formData.append("splitOptions", JSON.stringify(splitOptions || {}));

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/split")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "split-output.zip"),
    message: readOperationMessage(response.headers, "PDF split completed successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const extractPdfToDocx = async (baseUrl, file, extractOptions = {}, options = {}) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("extractOptions", JSON.stringify(extractOptions || {}));

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/extract-to-docx")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "extracted.docx"),
    message: readOperationMessage(response.headers, "PDF text extracted to Word successfully"),
    requestId: readRequestId(response.headers),
  };
};
