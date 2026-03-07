/*
  This composable reuses the portal's upload and task-polling pattern while
  enforcing DOCX-only selection and at-least-one-rule validation for books.
*/
import { computed, onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import { applyGreekLiteratureEditor } from "../services/booksService";
import { getTaskProgress } from "../services/taskService";

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const GREEK_EDITOR_RULES = [
  "kai_before_vowel",
  "stin_article_trim",
  "min_negation_trim",
  "sa_to_san",
  "ellipsis_normalize",
];

export const useGreekLiteratureEditor = () => {
  const file = ref(null);
  const selectedRuleIds = ref([...GREEK_EDITOR_RULES]);
  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const resultUrl = ref("");
  const resultName = ref("");
  const progressPercent = ref(0);
  const progressLabel = ref("");

  let pollIntervalId = null;

  const clearTaskPolling = () => {
    if (pollIntervalId) {
      window.clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
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
    progressLabel.value = task?.step || "Applying literature rules...";

    if (task?.status === "completed") {
      progressPercent.value = 100;
      progressLabel.value = task?.step || "Editor completed";
      clearTaskPolling();
    }

    if (task?.status === "failed") {
      progressLabel.value = task?.step || "Editor failed";
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
        // Polling failures should not interrupt the active editor request.
      }
    };

    void poll();
    pollIntervalId = window.setInterval(() => {
      void poll();
    }, 450);
  };

  const onUploadProgress = ({ ratio }) => {
    if (!Number.isFinite(ratio)) {
      return;
    }

    const uploadPercent = Math.max(3, Math.min(30, Math.round(ratio * 30)));
    progressPercent.value = Math.max(progressPercent.value, uploadPercent);
    progressLabel.value =
      ratio < 1 ? "Uploading manuscript..." : "Upload complete. Waiting for editing...";
  };

  const selectFiles = (nextFiles) => {
    clearResult();
    error.value = "";

    if (!Array.isArray(nextFiles) || nextFiles.length === 0) {
      file.value = null;
      return;
    }

    if (nextFiles.length > MAX_UPLOAD_FILES) {
      error.value = `Select up to ${MAX_UPLOAD_FILES} files per request.`;
      return;
    }

    if (nextFiles.length !== 1) {
      error.value = "Greek literature editing requires exactly one DOCX file.";
      return;
    }

    const nextFile = nextFiles[0];
    const isDocxMime =
      nextFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDocxName = /\.docx$/i.test(nextFile.name || "");

    if (!isDocxMime && !isDocxName) {
      error.value = "Select a DOCX file.";
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      error.value = `File must be <= ${MAX_FILE_SIZE_MB} MB.`;
      return;
    }

    if (nextFile.size > MAX_TOTAL_UPLOAD_BYTES) {
      error.value = `Total upload must be <= ${MAX_TOTAL_UPLOAD_MB} MB.`;
      return;
    }

    file.value = nextFile;
  };

  const toggleRule = (ruleId) => {
    if (loading.value) {
      return;
    }

    selectedRuleIds.value = selectedRuleIds.value.includes(ruleId)
      ? selectedRuleIds.value.filter((id) => id !== ruleId)
      : [...selectedRuleIds.value, ruleId];
  };

  const applyEditor = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (!file.value) {
      error.value = 'Select one DOCX file for the "files" field.';
      return;
    }

    if (selectedRuleIds.value.length === 0) {
      error.value = "Select at least one correction rule.";
      return;
    }

    loading.value = true;

    const taskId = createTaskId();
    startTaskPolling(baseUrl, taskId);

    try {
      progressPercent.value = 1;
      progressLabel.value = "Preparing request...";

      const result = await applyGreekLiteratureEditor(
        baseUrl,
        file.value,
        { ruleIds: selectedRuleIds.value },
        {
          taskId,
          onUploadProgress,
        }
      );

      resultUrl.value = URL.createObjectURL(result.blob);
      resultName.value = result.fileName;
      message.value = result.message;
      requestId.value = result.requestId;
      progressPercent.value = 100;
      progressLabel.value = "Corrected manuscript ready";
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : "Editing failed";
      progressLabel.value = "Editor failed";
    } finally {
      loading.value = false;
      clearTaskPolling();
    }
  };

  onBeforeUnmount(() => {
    clearTaskPolling();

    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value);
    }
  });

  const hasFile = computed(() => Boolean(file.value));
  const hasSelectedRules = computed(() => selectedRuleIds.value.length > 0);

  return {
    file,
    selectedRuleIds,
    loading,
    error,
    message,
    requestId,
    resultUrl,
    resultName,
    progressPercent,
    progressLabel,
    hasFile,
    hasSelectedRules,
    selectFiles,
    toggleRule,
    applyEditor,
  };
};
