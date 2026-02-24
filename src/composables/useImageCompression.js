// This composable now combines upload telemetry with real backend task polling to show realistic compression progress and current processing step.
import { onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { compressImages } from "../services/imageService";
import { getTaskProgress } from "../services/taskService";

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useImageCompression = () => {
  const files = ref([]);
  const mode = ref("balanced");
  const advancedOptions = ref({
    quality: 72,
    format: "webp",
    maxWidth: 1920,
    maxHeight: 1920,
    effort: 5,
    lossless: false,
  });

  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const archiveUrl = ref("");
  const archiveName = ref("");

  const progressPercent = ref(0);
  const progressLabel = ref("");

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

  const applyBackendProgress = (task) => {
    const backendProgress = Number.isFinite(task?.progress) ? Number(task.progress) : 0;
    const mappedPercent = Math.min(
      99,
      Math.round(30 + (Math.max(0, Math.min(100, backendProgress)) / 100) * 70)
    );

    progressPercent.value = Math.max(progressPercent.value, mappedPercent);
    progressLabel.value = task?.step || "Compressing images...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Compression completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Compression failed";
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
        // Polling failures should not interrupt the active compression request.
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
      ratio < 1 ? "Uploading images..." : "Upload complete. Waiting for processing...";
    void loaded;
    void total;
  };

  const clearResult = () => {
    if (archiveUrl.value) {
      URL.revokeObjectURL(archiveUrl.value);
    }

    archiveUrl.value = "";
    archiveName.value = "";
    message.value = "";
    requestId.value = "";
  };

  const selectFiles = (nextFiles) => {
    clearResult();
    error.value = "";

    if (nextFiles.length > MAX_UPLOAD_FILES) {
      error.value = `Select up to ${MAX_UPLOAD_FILES} files per request.`;
      return;
    }

    const oversized = nextFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      const names = oversized
        .slice(0, 3)
        .map((file) => file.name)
        .join(", ");
      error.value = `Each file must be <= ${MAX_FILE_SIZE_MB} MB. Too large: ${names}`;
      return;
    }

    const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      error.value = `Total upload must be <= ${MAX_TOTAL_UPLOAD_MB} MB (current: ${formatMb(totalSize)}).`;
      return;
    }

    files.value = nextFiles;
  };

  const compress = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (files.value.length === 0) {
      error.value = 'Select at least one image file for the "files" field.';
      return;
    }

    loading.value = true;
    progressLabel.value = "Preparing upload...";

    const taskId = createTaskId();

    try {
      const payload = mode.value === "advanced" ? { ...advancedOptions.value } : null;
      startTaskPolling(baseUrl, taskId);

      const result = await compressImages(baseUrl, files.value, mode.value, payload, {
        taskId,
        onUploadProgress,
      });

      archiveName.value = result.fileName;
      archiveUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      progressLabel.value = "Compression completed";
    } catch (compressError) {
      error.value =
        compressError instanceof Error ? compressError.message : "Image compression request failed";
      progressLabel.value = "Compression failed";
    } finally {
      clearTaskPolling();
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    clearResult();
    resetProgress();
  });

  return {
    files,
    mode,
    advancedOptions,
    loading,
    error,
    message,
    requestId,
    archiveUrl,
    archiveName,
    progressPercent,
    progressLabel,
    selectFiles,
    compress,
  };
};
