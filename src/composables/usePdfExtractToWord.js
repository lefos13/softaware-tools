// Why this exists: PDF text extraction has long-running OCR work, so this composable reuses upload telemetry + backend task polling while enforcing extract option defaults.
import { computed, onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { extractPdfToDocx } from "../services/pdfService";
import { getTaskProgress } from "../services/taskService";

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const usePdfExtractToWord = () => {
  const file = ref(null);
  const filePreviewUrl = ref("");
  const includePageBreaks = ref(true);
  const includeOcrUsageNotes = ref(false);
  const languageMode = ref("both");
  const extractionQualityMode = ref("ultra");

  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const resultUrl = ref("");
  const resultName = ref("");

  const progressPercent = ref(0);
  const progressLabel = ref("");

  const resolveLanguages = () => {
    if (languageMode.value === "en") {
      return ["eng"];
    }

    if (languageMode.value === "gr") {
      return ["ell"];
    }

    return ["eng", "ell"];
  };

  let pollIntervalId = null;

  const clearTaskPolling = () => {
    if (pollIntervalId) {
      window.clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  };

  const resetProgress = () => {
    clearTaskPolling();
    progressPercent.value = 0;
    progressLabel.value = "";
  };

  const clearResult = () => {
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value);
    }

    resultUrl.value = "";
    resultName.value = "";
    message.value = "";
    requestId.value = "";
  };

  const setPreview = (nextFile) => {
    if (filePreviewUrl.value) {
      URL.revokeObjectURL(filePreviewUrl.value);
      filePreviewUrl.value = "";
    }

    if (nextFile) {
      filePreviewUrl.value = URL.createObjectURL(nextFile);
    }
  };

  const applyBackendProgress = (task) => {
    const backendProgress = Number.isFinite(task?.progress) ? Number(task.progress) : 0;
    const mappedPercent = Math.min(
      99,
      Math.round(30 + (Math.max(0, Math.min(100, backendProgress)) / 100) * 70)
    );

    progressPercent.value = Math.max(progressPercent.value, mappedPercent);
    progressLabel.value = task?.step || "Extracting text and OCR content...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Extraction completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Extraction failed";
      clearTaskPolling();
    }
  };

  const startTaskPolling = (baseUrl, taskId) => {
    clearTaskPolling();

    const poll = async () => {
      try {
        const task = await getTaskProgress(baseUrl, taskId);
        if (task) {
          applyBackendProgress(task);
        }
      } catch {
        // Polling failures should not interrupt active extraction requests.
      }
    };

    void poll();
    pollIntervalId = window.setInterval(() => {
      void poll();
    }, 450);
  };

  const onUploadProgress = ({ loaded, total, ratio }) => {
    if (!Number.isFinite(ratio)) {
      return;
    }

    const uploadPercent = Math.max(3, Math.min(30, Math.round(ratio * 30)));
    progressPercent.value = Math.max(progressPercent.value, uploadPercent);
    progressLabel.value =
      ratio < 1 ? "Uploading PDF..." : "Upload complete. Waiting for extraction...";
    void loaded;
    void total;
  };

  const selectFiles = (nextFiles) => {
    clearResult();
    error.value = "";

    if (!Array.isArray(nextFiles) || nextFiles.length === 0) {
      file.value = null;
      setPreview(null);
      return;
    }

    if (nextFiles.length > MAX_UPLOAD_FILES) {
      error.value = `Select up to ${MAX_UPLOAD_FILES} files per request.`;
      return;
    }

    if (nextFiles.length !== 1) {
      error.value = "PDF extraction requires exactly one PDF file.";
      return;
    }

    const nextFile = nextFiles[0];
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      error.value = `File must be <= ${MAX_FILE_SIZE_MB} MB.`;
      return;
    }

    if (nextFile.size > MAX_TOTAL_UPLOAD_BYTES) {
      error.value = `Total upload must be <= ${MAX_TOTAL_UPLOAD_MB} MB.`;
      return;
    }

    file.value = nextFile;
    setPreview(nextFile);
  };

  const extract = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (!file.value) {
      error.value = 'Select one PDF file for the "files" field.';
      return;
    }

    loading.value = true;

    const taskId = createTaskId();
    startTaskPolling(baseUrl, taskId);

    try {
      progressPercent.value = 1;
      progressLabel.value = "Preparing request...";

      const {
        blob,
        fileName,
        message: successMessage,
        requestId: resolvedRequestId,
      } = await extractPdfToDocx(
        baseUrl,
        file.value,
        {
          ocrMode: "hybrid",
          languages: resolveLanguages(),
          processingProfile: extractionQualityMode.value,
          includePageBreaks: includePageBreaks.value,
          includeConfidenceMarkers: includeOcrUsageNotes.value,
        },
        {
          taskId,
          onUploadProgress,
        }
      );

      resultUrl.value = URL.createObjectURL(blob);
      resultName.value = fileName;
      message.value = successMessage;
      requestId.value = resolvedRequestId;
      progressPercent.value = 100;
      progressLabel.value = "Word document ready";
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : "Extraction failed";
      progressLabel.value = "Extraction failed";
    } finally {
      loading.value = false;
      clearTaskPolling();
    }
  };

  onBeforeUnmount(() => {
    clearTaskPolling();

    if (filePreviewUrl.value) {
      URL.revokeObjectURL(filePreviewUrl.value);
    }

    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value);
    }
  });

  const hasFile = computed(() => Boolean(file.value));

  return {
    file,
    filePreviewUrl,
    includePageBreaks,
    includeOcrUsageNotes,
    languageMode,
    extractionQualityMode,
    loading,
    error,
    message,
    requestId,
    resultUrl,
    resultName,
    progressPercent,
    progressLabel,
    hasFile,
    selectFiles,
    extract,
  };
};
