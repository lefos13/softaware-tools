// Why this exists: PDF split needs the same upload telemetry and backend task polling model as merge/image flows, while handling mode-specific split options safely before request submission.
import { computed, onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { splitPdfFile } from "../services/pdfService";
import { getTaskProgress } from "../services/taskService";

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseCsvPages = (inputValue) => {
  return String(inputValue || "")
    .split(",")
    .map((chunk) => Number.parseInt(chunk.trim(), 10))
    .filter((value) => Number.isInteger(value));
};

const parseRangeTokens = (inputValue) => {
  return String(inputValue || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
};

export const usePdfSplit = () => {
  const file = ref(null);
  const filePreviewUrl = ref("");
  const mode = ref("range");

  const rangeOptions = ref({ fromPage: 1, toPage: 1 });
  const selectedPagesInput = ref("1,5,10");
  const chunkSize = ref(4);
  const customGroups = ref([
    { id: 1, name: "intro", rangesInput: "1-3", pagesInput: "8" },
    { id: 2, name: "appendix", rangesInput: "20-25", pagesInput: "" },
  ]);
  let nextGroupId = 3;

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
    progressLabel.value = task?.step || "Splitting PDF...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Split completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Split failed";
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
        // Polling failures should not interrupt active split requests.
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
      ratio < 1 ? "Uploading PDF..." : "Upload complete. Waiting for processing...";
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

  const setPreview = (nextFile) => {
    if (filePreviewUrl.value) {
      URL.revokeObjectURL(filePreviewUrl.value);
      filePreviewUrl.value = "";
    }

    if (nextFile) {
      filePreviewUrl.value = URL.createObjectURL(nextFile);
    }
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
      error.value = "PDF split requires exactly one PDF file.";
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

  const addCustomGroup = () => {
    customGroups.value = [
      ...customGroups.value,
      { id: nextGroupId++, name: "", rangesInput: "", pagesInput: "" },
    ];
  };

  const removeCustomGroup = (id) => {
    customGroups.value = customGroups.value.filter((group) => group.id !== id);
  };

  const canRemoveCustomGroup = computed(() => customGroups.value.length > 1);

  const buildSplitOptions = () => {
    if (mode.value === "range") {
      const fromPage = Number.parseInt(rangeOptions.value.fromPage, 10);
      const toPage = Number.parseInt(rangeOptions.value.toPage, 10);

      if (!Number.isInteger(fromPage) || !Number.isInteger(toPage) || fromPage < 1 || toPage < 1) {
        throw new Error("Range mode requires from/to pages as positive integers.");
      }

      return { fromPage, toPage };
    }

    if (mode.value === "selected_pages") {
      const pages = parseCsvPages(selectedPagesInput.value);
      if (pages.length === 0) {
        throw new Error("Selected pages mode requires at least one page number.");
      }

      if (pages.some((page) => page < 1)) {
        throw new Error("Selected pages must be 1-based positive numbers.");
      }

      return { pages };
    }

    if (mode.value === "every_n_pages") {
      const parsedChunkSize = Number.parseInt(chunkSize.value, 10);
      if (!Number.isInteger(parsedChunkSize) || parsedChunkSize < 1) {
        throw new Error("Every N pages mode requires chunk size as positive integer.");
      }

      return { chunkSize: parsedChunkSize };
    }

    const groups = customGroups.value.map((group) => ({
      name: group.name,
      ranges: parseRangeTokens(group.rangesInput),
      pages: parseCsvPages(group.pagesInput),
    }));

    if (groups.length === 0) {
      throw new Error("Custom groups mode requires at least one group.");
    }

    const hasEmptyGroup = groups.some(
      (group) => group.ranges.length === 0 && group.pages.length === 0
    );
    if (hasEmptyGroup) {
      throw new Error("Each custom group requires at least one range or page.");
    }

    return { groups };
  };

  const split = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (!file.value) {
      error.value = 'Select exactly one PDF file for the "files" field.';
      return;
    }

    loading.value = true;
    progressLabel.value = "Preparing upload...";

    const taskId = createTaskId();

    try {
      const splitOptions = buildSplitOptions();
      startTaskPolling(baseUrl, taskId);

      const result = await splitPdfFile(baseUrl, file.value, mode.value, splitOptions, {
        taskId,
        onUploadProgress,
      });

      archiveName.value = result.fileName;
      archiveUrl.value = URL.createObjectURL(result.blob);
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      progressLabel.value = "Split completed";
    } catch (splitError) {
      error.value = splitError instanceof Error ? splitError.message : "PDF split request failed";
      progressLabel.value = "Split failed";
    } finally {
      clearTaskPolling();
      loading.value = false;
    }
  };

  onBeforeUnmount(() => {
    clearResult();
    resetProgress();
    setPreview(null);
  });

  return {
    file,
    filePreviewUrl,
    mode,
    rangeOptions,
    selectedPagesInput,
    chunkSize,
    customGroups,
    loading,
    error,
    message,
    requestId,
    archiveUrl,
    archiveName,
    progressPercent,
    progressLabel,
    canRemoveCustomGroup,
    selectFiles,
    addCustomGroup,
    removeCustomGroup,
    split,
  };
};
