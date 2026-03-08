/*
  This composable now keeps only the editor request state so the component can
  own token validation, persistence, logout, and environment-specific gating.
*/
import { computed, onBeforeUnmount, ref } from "vue";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_TOTAL_UPLOAD_MB,
  MAX_UPLOAD_FILES,
} from "../config/uploadLimits";
import {
  BOOKS_GREEK_EDITOR_PREFERENCES,
  BOOKS_GREEK_EDITOR_RULES,
} from "../config/booksGreekEditorRules";
import {
  applyGreekLiteratureEditor,
  applyGreekLiteratureEditorText,
  previewGreekLiteratureEditorReport,
} from "../services/booksService";
import { getTaskProgress } from "../services/taskService";

const createTaskId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildDefaultPreferences = () =>
  Object.fromEntries(
    Object.entries(BOOKS_GREEK_EDITOR_PREFERENCES).map(([key, config]) => [
      key,
      config.defaultValue,
    ])
  );

export const useGreekLiteratureEditor = () => {
  const inputMode = ref("docx");
  const serviceToken = ref("");
  const file = ref(null);
  const inputText = ref("");
  const selectedRuleIds = ref([]);
  const preferences = ref(buildDefaultPreferences());
  const includeReport = ref(false);
  const loading = ref(false);
  const error = ref("");
  const message = ref("");
  const requestId = ref("");
  const resultUrl = ref("");
  const resultName = ref("");
  const resultText = ref("");
  const resultTextUrl = ref("");
  const resultTextName = ref("corrected-text.txt");
  const reportData = ref(null);
  const reportText = ref("");
  const reportUrl = ref("");
  const reportName = ref("greek-editor-report.txt");
  const progressPercent = ref(0);
  const progressLabel = ref("");

  let pollIntervalId = null;

  const clearTaskPolling = () => {
    if (pollIntervalId) {
      window.clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  };

  const revokeIfPresent = (url) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const clearResult = () => {
    revokeIfPresent(resultUrl.value);
    revokeIfPresent(resultTextUrl.value);
    revokeIfPresent(reportUrl.value);

    resultUrl.value = "";
    resultName.value = "";
    resultText.value = "";
    resultTextUrl.value = "";
    reportData.value = null;
    reportText.value = "";
    reportUrl.value = "";
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

  const buildEditorOptions = () => ({
    ruleIds: selectedRuleIds.value,
    includeReport: includeReport.value,
    preferences: preferences.value,
  });

  const writeTextOutputs = (correctedValue, reportValue, reportPayload = null) => {
    revokeIfPresent(resultTextUrl.value);
    revokeIfPresent(reportUrl.value);

    resultText.value = correctedValue;
    resultTextUrl.value = correctedValue
      ? URL.createObjectURL(new Blob([correctedValue], { type: "text/plain;charset=utf-8" }))
      : "";
    reportData.value = reportPayload;
    reportText.value = reportValue;
    reportUrl.value = reportValue
      ? URL.createObjectURL(new Blob([reportValue], { type: "text/plain;charset=utf-8" }))
      : "";
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

  const setInputMode = (nextMode) => {
    if (loading.value) {
      return;
    }

    inputMode.value = nextMode === "text" ? "text" : "docx";
    clearResult();
    error.value = "";
  };

  const setInputText = (value) => {
    inputText.value = String(value || "");
    clearResult();
    error.value = "";
  };

  const setServiceToken = (value) => {
    serviceToken.value = String(value || "").trim();
    error.value = "";
  };

  const clearServiceToken = () => {
    serviceToken.value = "";
    error.value = "";
  };

  const toggleRule = (ruleId) => {
    if (loading.value) {
      return;
    }

    selectedRuleIds.value = selectedRuleIds.value.includes(ruleId)
      ? selectedRuleIds.value.filter((id) => id !== ruleId)
      : [...selectedRuleIds.value, ruleId];
  };

  const setAllRules = (value) => {
    if (loading.value) {
      return;
    }

    selectedRuleIds.value = value ? BOOKS_GREEK_EDITOR_RULES.map(({ id }) => id) : [];
  };

  const setPreference = (key, value) => {
    if (loading.value) {
      return;
    }

    preferences.value = {
      ...preferences.value,
      [key]: value,
    };
  };

  const setIncludeReport = (value) => {
    includeReport.value = value === true;

    if (!includeReport.value) {
      reportData.value = null;
      revokeIfPresent(reportUrl.value);
      reportText.value = "";
      reportUrl.value = "";
    }
  };

  const applyEditor = async (baseUrl) => {
    clearResult();
    error.value = "";
    resetProgress();

    if (selectedRuleIds.value.length === 0) {
      error.value = "Select at least one correction rule.";
      return;
    }

    if (inputMode.value === "docx" && !file.value) {
      error.value = 'Select one DOCX file for the "files" field.';
      return;
    }

    if (inputMode.value === "text" && !inputText.value.trim()) {
      error.value = "Paste text before applying the selected rules.";
      return;
    }

    loading.value = true;

    const taskId = createTaskId();
    startTaskPolling(baseUrl, taskId);

    try {
      progressPercent.value = 1;
      progressLabel.value = "Preparing request...";

      if (inputMode.value === "docx") {
        const result = await applyGreekLiteratureEditor(baseUrl, file.value, buildEditorOptions(), {
          taskId,
          onUploadProgress,
          serviceToken: serviceToken.value,
        });

        resultUrl.value = URL.createObjectURL(result.blob);
        resultName.value = result.fileName;
        message.value = result.message;
        requestId.value = result.requestId;

        if (includeReport.value) {
          try {
            const preview = await previewGreekLiteratureEditorReport(
              baseUrl,
              file.value,
              buildEditorOptions(),
              { serviceToken: serviceToken.value }
            );
            revokeIfPresent(reportUrl.value);
            reportData.value = preview.report;
            reportText.value = preview.reportText;
            reportUrl.value = preview.reportText
              ? URL.createObjectURL(
                  new Blob([preview.reportText], { type: "text/plain;charset=utf-8" })
                )
              : "";
          } catch {
            // The download should still succeed even if the report preview cannot be shown.
          }
        }

        progressPercent.value = 100;
        progressLabel.value = "Corrected manuscript ready";
      } else {
        const result = await applyGreekLiteratureEditorText(
          baseUrl,
          inputText.value,
          buildEditorOptions(),
          { taskId, serviceToken: serviceToken.value }
        );

        writeTextOutputs(result.correctedText, result.reportText, result.report);
        message.value = result.message;
        requestId.value = result.requestId;
        progressPercent.value = 100;
        progressLabel.value = "Corrected text ready";
      }
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
    clearResult();
  });

  const rulesBySection = computed(() =>
    BOOKS_GREEK_EDITOR_RULES.reduce(
      (sections, rule) => ({
        ...sections,
        [rule.section]: [...(sections[rule.section] || []), rule],
      }),
      {}
    )
  );
  const hasFile = computed(() => Boolean(file.value));
  const hasSelectedRules = computed(() => selectedRuleIds.value.length > 0);
  const allRulesSelected = computed(
    () => selectedRuleIds.value.length === BOOKS_GREEK_EDITOR_RULES.length
  );
  const hasTextInput = computed(() => inputText.value.trim().length > 0);
  const hasInput = computed(() =>
    inputMode.value === "docx" ? hasFile.value : hasTextInput.value
  );
  const hasBinaryResult = computed(() => Boolean(resultUrl.value));
  const hasTextResult = computed(() => Boolean(resultText.value));

  return {
    inputMode,
    serviceToken,
    file,
    inputText,
    selectedRuleIds,
    allRulesSelected,
    preferences,
    includeReport,
    loading,
    error,
    message,
    requestId,
    resultUrl,
    resultName,
    resultText,
    resultTextUrl,
    resultTextName,
    reportData,
    reportText,
    reportUrl,
    reportName,
    progressPercent,
    progressLabel,
    rulesBySection,
    hasFile,
    hasSelectedRules,
    hasTextInput,
    hasInput,
    hasBinaryResult,
    hasTextResult,
    setInputMode,
    setServiceToken,
    clearServiceToken,
    selectFiles,
    setInputText,
    toggleRule,
    setAllRules,
    setPreference,
    setIncludeReport,
    applyEditor,
  };
};
