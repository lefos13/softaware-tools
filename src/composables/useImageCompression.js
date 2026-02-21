// This composable provides image compression mode handling, advanced options, and upload-size guards before API requests.
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
      const result = await compressImages(baseUrl, files.value, mode.value, payload);

      archiveName.value = result.fileName;
      archiveUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
    } catch (compressError) {
      error.value =
        compressError instanceof Error ? compressError.message : "Image compression request failed";
    } finally {
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    clearResult();
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
    selectFiles,
    compress,
  };
};
