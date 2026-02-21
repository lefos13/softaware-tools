// Image service now supports live upload progress callbacks so compression flow can show real-time progress and ETA.
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

  const response = await uploadMultipartBinary({
    url: buildUrl(baseUrl, "/api/image/compress"),
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
