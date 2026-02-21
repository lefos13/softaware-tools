// This composable now exposes live merge progress (upload + processing estimate) so users see percent complete and time remaining.
import { onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { mergePdfFiles } from "../services/pdfService";

let nextPreviewId = 1;

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

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
  const etaSeconds = ref(0);
  const progressLabel = ref("");

  let progressIntervalId = null;
  let progressStartedAt = 0;
  let estimatedDurationMs = 0;

  const clearProgressLoop = () => {
    if (progressIntervalId) {
      window.clearInterval(progressIntervalId);
      progressIntervalId = null;
    }
  };

  const resetProgress = () => {
    clearProgressLoop();
    progressPercent.value = 0;
    etaSeconds.value = 0;
    progressLabel.value = "";
  };

  const startProgress = (totalBytes) => {
    progressStartedAt = Date.now();
    const totalMb = totalBytes / (1024 * 1024);
    estimatedDurationMs = 2200 + totalMb * 1400 + files.value.length * 650;

    progressPercent.value = 3;
    etaSeconds.value = Math.max(1, Math.ceil(estimatedDurationMs / 1000));
    progressLabel.value = "Uploading files...";

    clearProgressLoop();
    progressIntervalId = window.setInterval(() => {
      const elapsed = Date.now() - progressStartedAt;
      const estimated = Math.min(95, Math.round((elapsed / estimatedDurationMs) * 100));

      progressPercent.value = Math.max(progressPercent.value, estimated);

      if (progressPercent.value >= 70) {
        progressLabel.value = "Processing and merging files...";
      }

      const remainingMs = Math.max(estimatedDurationMs - elapsed, 0);
      etaSeconds.value = Math.max(1, Math.ceil(remainingMs / 1000));
    }, 260);
  };

  const onUploadProgress = ({ loaded, total, ratio }) => {
    if (!Number.isFinite(ratio)) {
      return;
    }

    const uploadProgress = Math.min(70, Math.max(5, Math.round(ratio * 70)));
    progressPercent.value = Math.max(progressPercent.value, uploadProgress);
    progressLabel.value = ratio < 1 ? "Uploading files..." : "Processing and merging files...";

    const elapsedSeconds = (Date.now() - progressStartedAt) / 1000;
    if (total > 0 && loaded > 0 && elapsedSeconds > 0) {
      const speed = loaded / elapsedSeconds;
      if (speed > 0) {
        etaSeconds.value = Math.max(1, Math.ceil((total - loaded) / speed));
      }
    }
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

    if (files.value.length < 2) {
      error.value = 'Select at least 2 PDF files for the "files" field.';
      return;
    }

    loading.value = true;

    try {
      const uploadFiles = [...files.value]
        .sort((left, right) => left.sourceIndex - right.sourceIndex)
        .map((entry) => entry.file);

      const totalBytes = uploadFiles.reduce((sum, file) => sum + file.size, 0);
      startProgress(totalBytes);

      const mergePlan = files.value.map((entry) => ({
        sourceIndex: entry.sourceIndex,
        rotation: entry.rotation,
      }));

      const result = await mergePdfFiles(baseUrl, uploadFiles, mergePlan, { onUploadProgress });
      fileName.value = result.fileName;
      fileUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      etaSeconds.value = 0;
      progressLabel.value = "Merge completed";
    } catch (mergeError) {
      error.value = mergeError instanceof Error ? mergeError.message : "PDF merge request failed";
    } finally {
      clearProgressLoop();
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
    etaSeconds,
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
