// This composable now combines upload telemetry with real backend task polling to show realistic merge progress and current processing step.
import { onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { mergePdfFiles } from "../services/pdfService";
import { getTaskProgress } from "../services/taskService";

let nextPreviewId = 1;

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const usePdfMerge = () => {
  const files = ref([]);
  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const fileUrl = ref("");
  const fileName = ref("");
  const draggingId = ref(null);

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
    progressLabel.value = task?.step || "Processing and merging files...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Merge completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Merge failed";
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
        // Polling failures should not interrupt the active merge request.
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
      ratio < 1 ? "Uploading files..." : "Upload complete. Waiting for processing...";
    void loaded;
    void total;
  };

  const revokePreviewUrls = () => {
    files.value.forEach((entry) => {
      if (entry.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    });
  };

  const clearResult = () => {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
    }

    message.value = "";
    requestId.value = "";
    fileUrl.value = "";
    fileName.value = "";
  };

  const selectFiles = (nextFiles) => {
    clearResult();
    error.value = "";

    if (nextFiles.length > MAX_UPLOAD_FILES) {
      error.value = `Select up to ${MAX_UPLOAD_FILES} files per request.`;
      return;
    }

    const oversizedFiles = nextFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      const names = oversizedFiles
        .slice(0, 3)
        .map((file) => file.name)
        .join(", ");
      error.value = `Each file must be <= ${MAX_FILE_SIZE_MB} MB. Too large: ${names}`;
      return;
    }

    const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      error.value = `Total upload must be <= ${MAX_TOTAL_UPLOAD_MB} MB (current: ${formatBytes(totalSize)}).`;
      return;
    }

    revokePreviewUrls();

    files.value = nextFiles.map((file, sourceIndex) => ({
      id: nextPreviewId++,
      sourceIndex,
      name: file.name,
      size: file.size,
      rotation: 0,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  };

  const moveFile = (id, direction) => {
    const index = files.value.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.value.length) {
      return;
    }

    const updated = [...files.value];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    files.value = updated;
  };

  const startDragging = (id) => {
    draggingId.value = id;
  };

  const stopDragging = () => {
    draggingId.value = null;
  };

  const dropBefore = (targetId) => {
    if (!draggingId.value || draggingId.value === targetId) {
      return;
    }

    const sourceIndex = files.value.findIndex((entry) => entry.id === draggingId.value);
    const targetIndex = files.value.findIndex((entry) => entry.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      stopDragging();
      return;
    }

    const updated = [...files.value];
    const [dragged] = updated.splice(sourceIndex, 1);
    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    updated.splice(adjustedTargetIndex, 0, dragged);
    files.value = updated;

    stopDragging();
  };

  const rotateFile = (id, rotation) => {
    const parsed = Number.parseInt(rotation, 10);
    files.value = files.value.map((entry) =>
      entry.id === id ? { ...entry, rotation: Number.isNaN(parsed) ? 0 : parsed } : entry
    );
  };

  const merge = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (files.value.length < 2) {
      error.value = 'Select at least 2 PDF files for the "files" field.';
      return;
    }

    loading.value = true;
    progressLabel.value = "Preparing upload...";

    const taskId = createTaskId();

    try {
      const uploadFiles = [...files.value]
        .sort((left, right) => left.sourceIndex - right.sourceIndex)
        .map((entry) => entry.file);

      startTaskPolling(baseUrl, taskId);

      const mergePlan = files.value.map((entry) => ({
        sourceIndex: entry.sourceIndex,
        rotation: entry.rotation,
      }));

      const result = await mergePdfFiles(baseUrl, uploadFiles, mergePlan, {
        taskId,
        onUploadProgress,
      });

      fileName.value = result.fileName;
      fileUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      progressLabel.value = "Merge completed";
    } catch (mergeError) {
      error.value = mergeError instanceof Error ? mergeError.message : "PDF merge request failed";
      progressLabel.value = "Merge failed";
    } finally {
      clearTaskPolling();
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    revokePreviewUrls();
    clearResult();
    resetProgress();
  });

  return {
    files,
    loading,
    error,
    message,
    requestId,
    fileUrl,
    fileName,
    draggingId,
    progressPercent,
    progressLabel,
    selectFiles,
    moveFile,
    startDragging,
    stopDragging,
    dropBefore,
    rotateFile,
    merge,
  };
};
