// This composable now stores backend success metadata so merged-file flow can show clear completion messages and request references.
import { onBeforeUnmount, ref } from "vue";
import { mergePdfFiles } from "../services/pdfService";

export const usePdfMerge = () => {
  const files = ref([]);
  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const fileUrl = ref("");
  const fileName = ref("");

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
    files.value = nextFiles;
    error.value = "";
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
      const result = await mergePdfFiles(baseUrl, files.value);
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
    selectFiles,
    merge,
  };
};
