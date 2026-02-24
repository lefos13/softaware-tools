// Why this exists: image conversion needs consistent upload telemetry and backend task polling, while transparent-background workflows need single-file constraints plus before/after preview state.
import { onBeforeUnmount, ref, watch } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { convertImagePreview, convertImages } from "../services/imageService";
import { getTaskProgress } from "../services/taskService";

const ALPHA_FORMATS = ["png", "webp", "avif", "tiff", "gif"];
const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useImageConversion = () => {
  const files = ref([]);
  const targetFormat = ref("png");
  const conversionOptions = ref({
    quality: 82,
    effort: 5,
    lossless: false,
    transparentBackground: false,
    backgroundDetectionMode: "auto",
    colorTolerance: 32,
    pickerPoints: [],
  });

  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const archiveUrl = ref("");
  const archiveName = ref("");
  const originalPreviewUrl = ref("");
  const formattedPreviewUrl = ref("");
  const formattedPreviewName = ref("");

  const progressPercent = ref(0);
  const progressLabel = ref("");

  let pollIntervalId = null;

  watch(targetFormat, (nextTargetFormat) => {
    if (!ALPHA_FORMATS.includes(nextTargetFormat)) {
      conversionOptions.value.transparentBackground = false;
    }
  });

  watch(
    () => conversionOptions.value.transparentBackground,
    (enabled) => {
      if (!enabled) {
        conversionOptions.value.backgroundDetectionMode = "auto";
        conversionOptions.value.pickerPoints = [];
      }
    }
  );

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
    progressLabel.value = task?.step || "Converting images...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Conversion completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Conversion failed";
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
        // Polling failures should not interrupt the active conversion request.
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
      ratio < 1 ? "Uploading images..." : "Upload complete. Waiting for conversion...";
    void loaded;
    void total;
  };

  const revokeUrlIfAny = (urlRef) => {
    if (urlRef.value) {
      URL.revokeObjectURL(urlRef.value);
      urlRef.value = "";
    }
  };

  const clearResult = () => {
    revokeUrlIfAny(archiveUrl);
    revokeUrlIfAny(formattedPreviewUrl);
    archiveName.value = "";
    formattedPreviewName.value = "";
    message.value = "";
    requestId.value = "";
  };

  const setOriginalPreview = (file) => {
    revokeUrlIfAny(originalPreviewUrl);

    if (file) {
      originalPreviewUrl.value = URL.createObjectURL(file);
    }
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

    if (conversionOptions.value.transparentBackground && nextFiles.length !== 1) {
      error.value = "Transparent background conversion supports exactly one uploaded image.";
      return;
    }

    files.value = nextFiles;
    setOriginalPreview(nextFiles[0]);
    conversionOptions.value.pickerPoints = [];
  };

  const setBackgroundSeed = ({ x, y }) => {
    conversionOptions.value.backgroundDetectionMode = "picker";
    conversionOptions.value.pickerPoints = [
      ...conversionOptions.value.pickerPoints,
      {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      },
    ].slice(-30);
  };

  const clearBackgroundSeeds = () => {
    conversionOptions.value.pickerPoints = [];
  };

  const buildConversionPayload = () => {
    const payload = {
      quality: conversionOptions.value.quality,
      effort: conversionOptions.value.effort,
      lossless: conversionOptions.value.lossless,
      transparentBackground: conversionOptions.value.transparentBackground,
      colorTolerance: conversionOptions.value.colorTolerance,
    };

    if (conversionOptions.value.transparentBackground) {
      payload.backgroundDetectionMode = conversionOptions.value.backgroundDetectionMode;

      if (conversionOptions.value.backgroundDetectionMode === "picker") {
        payload.pickerPoints = conversionOptions.value.pickerPoints;
      }
    }

    return payload;
  };

  const convert = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (files.value.length === 0) {
      error.value = 'Select at least one image file for the "files" field.';
      return;
    }

    const transparentMode = conversionOptions.value.transparentBackground === true;
    if (transparentMode && files.value.length !== 1) {
      error.value = "Transparent background conversion supports exactly one uploaded image.";
      return;
    }

    if (
      transparentMode &&
      conversionOptions.value.backgroundDetectionMode === "picker" &&
      conversionOptions.value.pickerPoints.length === 0
    ) {
      error.value =
        "Pick one or more background points on the original preview image before converting.";
      return;
    }

    loading.value = true;
    progressLabel.value = "Preparing upload...";

    const taskId = createTaskId();

    try {
      startTaskPolling(baseUrl, taskId);

      const payload = buildConversionPayload();

      if (transparentMode) {
        const result = await convertImagePreview(
          baseUrl,
          files.value[0],
          targetFormat.value,
          payload,
          {
            taskId,
            onUploadProgress,
          }
        );

        const previewUrl = URL.createObjectURL(result.blob);
        formattedPreviewUrl.value = previewUrl;
        formattedPreviewName.value = result.fileName;
        archiveUrl.value = previewUrl;
        archiveName.value = result.fileName;
        message.value = result.message;
        requestId.value = result.requestId;
      } else {
        const result = await convertImages(baseUrl, files.value, targetFormat.value, payload, {
          taskId,
          onUploadProgress,
        });

        archiveName.value = result.fileName;
        archiveUrl.value = URL.createObjectURL(result.blob);
        message.value = result.message;
        requestId.value = result.requestId;
      }

      progressPercent.value = 100;
      progressLabel.value = "Conversion completed";
    } catch (convertError) {
      error.value =
        convertError instanceof Error ? convertError.message : "Image conversion request failed";
      progressLabel.value = "Conversion failed";
    } finally {
      clearTaskPolling();
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    clearResult();
    revokeUrlIfAny(originalPreviewUrl);
    resetProgress();
  });

  return {
    files,
    targetFormat,
    conversionOptions,
    loading,
    error,
    message,
    requestId,
    archiveUrl,
    archiveName,
    originalPreviewUrl,
    formattedPreviewUrl,
    formattedPreviewName,
    progressPercent,
    progressLabel,
    selectFiles,
    setBackgroundSeed,
    clearBackgroundSeeds,
    convert,
  };
};
