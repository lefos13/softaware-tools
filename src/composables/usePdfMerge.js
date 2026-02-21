// This composable now enforces upload-size guards and supports drag-and-drop reordering for safer, faster pre-merge setup.
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

      const mergePlan = files.value.map((entry) => ({
        sourceIndex: entry.sourceIndex,
        rotation: entry.rotation,
      }));

      const result = await mergePdfFiles(baseUrl, uploadFiles, mergePlan);
      fileName.value = result.fileName;
      fileUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
    } catch (mergeError) {
      error.value = mergeError instanceof Error ? mergeError.message : "PDF merge request failed";
    } finally {
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    revokePreviewUrls();
    clearResult();
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
    selectFiles,
    moveFile,
    startDragging,
    stopDragging,
    dropBefore,
    rotateFile,
    merge,
  };
};
