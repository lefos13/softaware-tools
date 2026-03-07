/*
  The Books service client mirrors the backend split between binary DOCX work
  and JSON text editing so the UI can keep one rule picker across both modes.
*/
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";

const buildTaskSuffix = (taskId) => (taskId ? `?taskId=${encodeURIComponent(taskId)}` : "");

export const applyGreekLiteratureEditor = async (
  baseUrl,
  file,
  editorOptions = {},
  options = {}
) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("editorOptions", JSON.stringify(editorOptions || {}));

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/books/greek-editor/apply")}${buildTaskSuffix(options.taskId)}`,
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

export const applyGreekLiteratureEditorText = async (
  baseUrl,
  inputText,
  editorOptions = {},
  options = {}
) => {
  const response = await fetch(
    `${buildUrl(baseUrl, "/api/books/greek-editor/apply-text")}${buildTaskSuffix(options.taskId)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputText,
        editorOptions,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();

  return {
    correctedText: payload?.data?.correctedText || "",
    summary: payload?.data?.summary || {},
    report: payload?.data?.report || null,
    reportText: payload?.data?.reportText || "",
    message: payload?.message || "Greek literature text corrections applied successfully",
    requestId: payload?.meta?.requestId || "",
  };
};

export const previewGreekLiteratureEditorReport = async (
  baseUrl,
  file,
  editorOptions = {},
  options = {}
) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("editorOptions", JSON.stringify(editorOptions || {}));

  const response = await fetch(
    `${buildUrl(baseUrl, "/api/books/greek-editor/preview-report")}${buildTaskSuffix(options.taskId)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();

  return {
    summary: payload?.data?.summary || {},
    report: payload?.data?.report || null,
    reportText: payload?.data?.reportText || "",
    message: payload?.message || "Greek literature report preview generated successfully",
    requestId: payload?.meta?.requestId || "",
  };
};
