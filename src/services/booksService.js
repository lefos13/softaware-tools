/*
  The Books service helper mirrors the binary upload contract used elsewhere so
  the new editor flow can reuse shared task ids, headers, and error handling.
*/
import {
  buildUrl,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";

export const applyGreekLiteratureEditor = async (
  baseUrl,
  file,
  editorOptions = {},
  options = {}
) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("editorOptions", JSON.stringify(editorOptions || {}));

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/books/greek-editor/apply")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
  });

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "manuscript-edited.docx"),
    message: readOperationMessage(
      response.headers,
      "Greek literature corrections applied successfully"
    ),
    requestId: readRequestId(response.headers),
  };
};
