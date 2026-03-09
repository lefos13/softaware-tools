/*
  The Books service client mirrors the backend split between binary DOCX work
  and JSON text editing while attaching the editor service token only to the
  protected Greek editor endpoints, including the access-validation handshake.
  A dedicated flowSessionId now groups apply + preview calls into one billing
  session so usage is consumed once per full books workflow.
*/
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";
import { emitAccessUsageUpdated, readActiveServiceToken } from "./accessClientState";

const buildTaskSuffix = (taskId, flowSessionId) => {
  const params = new URLSearchParams();

  if (taskId) {
    params.set("taskId", taskId);
  }

  if (flowSessionId) {
    params.set("flowSessionId", flowSessionId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
const buildServiceTokenHeaders = (serviceToken) =>
  (serviceToken ?? readActiveServiceToken())
    ? {
        "x-service-token": String(serviceToken ?? readActiveServiceToken()).trim(),
      }
    : {};

/*
  The validation call gives the browser a single source of truth for whether a
  persisted token can unlock the editor or must be discarded immediately.
*/
export const validateGreekLiteratureEditorAccess = async (baseUrl, serviceToken) => {
  const response = await fetch(buildUrl(baseUrl, "/api/books/greek-editor/access"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...buildServiceTokenHeaders(serviceToken),
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();

  return {
    authEnabled: payload?.data?.authEnabled !== false,
    token: payload?.data?.token || null,
    message: payload?.message || "Greek editor token validated successfully",
    requestId: payload?.meta?.requestId || "",
  };
};

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
    url: `${buildUrl(baseUrl, "/api/books/greek-editor/apply")}${buildTaskSuffix(
      options.taskId,
      options.flowSessionId
    )}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceTokenHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

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
    `${buildUrl(baseUrl, "/api/books/greek-editor/apply-text")}${buildTaskSuffix(
      options.taskId,
      options.flowSessionId
    )}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...buildServiceTokenHeaders(options.serviceToken),
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
  emitAccessUsageUpdated();

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
    `${buildUrl(baseUrl, "/api/books/greek-editor/preview-report")}${buildTaskSuffix(
      options.taskId,
      options.flowSessionId
    )}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...buildServiceTokenHeaders(options.serviceToken),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = await response.json();
  emitAccessUsageUpdated();

  return {
    summary: payload?.data?.summary || {},
    report: payload?.data?.report || null,
    reportText: payload?.data?.reportText || "",
    message: payload?.message || "Greek literature report preview generated successfully",
    requestId: payload?.meta?.requestId || "",
  };
};
