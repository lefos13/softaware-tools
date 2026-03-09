// PDF service now forwards task ids as query params so backend progress tracking works without custom-header transport issues.
import {
  buildUrl,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";
import { emitAccessUsageUpdated, readActiveServiceToken } from "./accessClientState";

const buildServiceHeaders = (serviceToken) => {
  const token = String(serviceToken ?? readActiveServiceToken()).trim();
  return token
    ? {
        "x-service-token": token,
      }
    : {};
};

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
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

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
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

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
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "extracted.docx"),
    message: readOperationMessage(response.headers, "PDF text extracted to Word successfully"),
    requestId: readRequestId(response.headers),
  };
};

/*
  Phase-3 PDF service helpers mirror existing upload patterns so new PDF tools
  stay aligned with backend contracts and shared response metadata handling.
*/
export const watermarkPdf = async (
  baseUrl,
  file,
  watermarkOptions = {},
  watermarkImage = null,
  options = {}
) => {
  const formData = new FormData();
  formData.append("files", file);
  if (watermarkImage) {
    formData.append("watermarkImage", watermarkImage);
  }

  if (watermarkOptions && Object.keys(watermarkOptions).length > 0) {
    formData.append("watermarkOptions", JSON.stringify(watermarkOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";
  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/watermark")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "watermarked.pdf"),
    message: readOperationMessage(response.headers, "PDF watermark applied successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const addPdfPageNumbers = async (baseUrl, file, pageNumberOptions = {}, options = {}) => {
  const formData = new FormData();
  formData.append("files", file);

  if (pageNumberOptions && Object.keys(pageNumberOptions).length > 0) {
    formData.append("pageNumberOptions", JSON.stringify(pageNumberOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";
  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/page-numbers")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "numbered.pdf"),
    message: readOperationMessage(response.headers, "PDF page numbers applied successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const editPdfPages = async (baseUrl, file, editPlan, options = {}) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("editPlan", JSON.stringify(editPlan || {}));

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";
  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/edit-pages")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "edited.pdf"),
    message: readOperationMessage(response.headers, "PDF pages edited successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const extractPdfText = async (baseUrl, file, textExtractOptions = {}, options = {}) => {
  const formData = new FormData();
  formData.append("files", file);

  if (textExtractOptions && Object.keys(textExtractOptions).length > 0) {
    formData.append("textExtractOptions", JSON.stringify(textExtractOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";
  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/extract-text")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "extracted.txt"),
    message: readOperationMessage(response.headers, "PDF text extracted successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const pdfFromImages = async (baseUrl, files, options = {}) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";
  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/pdf/from-images")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "from-images.pdf"),
    message: readOperationMessage(response.headers, "PDF generated from images successfully"),
    requestId: readRequestId(response.headers),
  };
};
