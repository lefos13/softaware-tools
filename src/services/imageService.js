// Image service sends compression mode/options and returns a single ZIP archive for multi-image download.
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
} from "./apiClient";

export const compressImages = async (baseUrl, files, mode, advancedOptions = null) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("mode", mode);

  if (mode === "advanced" && advancedOptions) {
    formData.append("advancedOptions", JSON.stringify(advancedOptions));
  }

  const response = await fetch(buildUrl(baseUrl, "/api/image/compress"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const blob = await response.blob();
  return {
    blob,
    fileName: unwrapFileName(response.headers, "compressed-images.zip"),
    message: readOperationMessage(response.headers, "Images compressed successfully"),
    requestId: readRequestId(response.headers),
  };
};
