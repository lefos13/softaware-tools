// Image service now forwards task ids as query params so backend progress tracking works without custom-header transport issues.
// It also exposes a format-conversion request path so image flows share one upload/error handling shape.
import {
  buildUrl,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";

export const compressImages = async (
  baseUrl,
  files,
  mode,
  advancedOptions = null,
  options = {}
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("mode", mode);

  if (mode === "advanced" && advancedOptions) {
    formData.append("advancedOptions", JSON.stringify(advancedOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/compress")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "compressed-images.zip"),
    message: readOperationMessage(response.headers, "Images compressed successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const convertImages = async (
  baseUrl,
  files,
  targetFormat,
  conversionOptions = null,
  options = {}
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("targetFormat", targetFormat);

  if (conversionOptions) {
    formData.append("conversionOptions", JSON.stringify(conversionOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/convert")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, `converted-images-${targetFormat}.zip`),
    message: readOperationMessage(response.headers, "Images converted successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const convertImagePreview = async (
  baseUrl,
  file,
  targetFormat,
  conversionOptions = null,
  options = {}
) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("targetFormat", targetFormat);

  if (conversionOptions) {
    formData.append("conversionOptions", JSON.stringify(conversionOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/convert-preview")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  const extensionByFormat = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    avif: "avif",
    tiff: "tiff",
    gif: "gif",
  };

  return {
    blob: response.blob,
    fileName: unwrapFileName(
      response.headers,
      `converted-preview.${extensionByFormat[targetFormat] || "bin"}`
    ),
    message: readOperationMessage(response.headers, "Image preview generated successfully"),
    requestId: readRequestId(response.headers),
  };
};
