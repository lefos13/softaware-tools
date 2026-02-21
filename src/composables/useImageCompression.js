// This composable now exposes live compression progress (upload + processing estimate) so users see percent complete and time remaining.
import { onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { compressImages } from "../services/imageService";

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const modeFactor = (mode) => {
  const factors = {
    light: 1,
    balanced: 1.2,
    aggressive: 1.45,
    advanced: 1.7,
  };

  return factors[mode] || 1.2;
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
    const baseDuration = 1800 + totalMb * 1200 + files.value.length * 500;
    estimatedDurationMs = baseDuration * modeFactor(mode.value);

    progressPercent.value = 3;
    etaSeconds.value = Math.max(1, Math.ceil(estimatedDurationMs / 1000));
    progressLabel.value = "Uploading images...";

    clearProgressLoop();
    progressIntervalId = window.setInterval(() => {
      const elapsed = Date.now() - progressStartedAt;
      const estimated = Math.min(95, Math.round((elapsed / estimatedDurationMs) * 100));

      progressPercent.value = Math.max(progressPercent.value, estimated);

      if (progressPercent.value >= 70) {
        progressLabel.value = "Compressing images...";
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
    progressLabel.value = ratio < 1 ? "Uploading images..." : "Compressing images...";

    const elapsedSeconds = (Date.now() - progressStartedAt) / 1000;
    if (total > 0 && loaded > 0 && elapsedSeconds > 0) {
      const speed = loaded / elapsedSeconds;
      if (speed > 0) {
        etaSeconds.value = Math.max(1, Math.ceil((total - loaded) / speed));
      }
    }
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

    if (files.value.length === 0) {
      error.value = 'Select at least one image file for the "files" field.';
      return;
    }

    loading.value = true;

    try {
      const payload = mode.value === "advanced" ? { ...advancedOptions.value } : null;
      const totalBytes = files.value.reduce((sum, file) => sum + file.size, 0);
      startProgress(totalBytes);

      const result = await compressImages(baseUrl, files.value, mode.value, payload, {
        onUploadProgress,
      });

      archiveName.value = result.fileName;
      archiveUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      etaSeconds.value = 0;
      progressLabel.value = "Compression completed";
    } catch (compressError) {
      error.value =
        compressError instanceof Error ? compressError.message : "Image compression request failed";
    } finally {
      clearProgressLoop();
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
    etaSeconds,
    progressLabel,
    selectFiles,
    compress,
  };
};
