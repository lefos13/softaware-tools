// Image service now forwards task ids as query params so backend progress tracking works without custom-header transport issues.
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
