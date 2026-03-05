/*
  Shared runner composable orchestrates tool execution, option state, debounce,
  and download/copy actions for the reusable JSON workspace view.
*/
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { buildDefaultOptions } from "../services/jsonTools/presets";
import { buildDownloadName } from "../services/jsonTools/formatters";
import { renderJsonAsImage } from "../services/jsonTools/visual";

const MAX_INPUT_CHARS = 750000;

export const useJsonToolRunner = (toolRef) => {
  const activeTool = computed(() => toolRef.value);
  const primaryInput = ref("");
  const secondaryInput = ref("");
  const options = ref(buildDefaultOptions(activeTool.value));
  const outputText = ref("");
  const outputUrl = ref("");
  const outputBlob = ref(null);
  const loading = ref(false);
  const autoRun = ref(true);
  const error = ref(null);
  const message = ref("");

  let debounceTimer = null;
  let requestCounter = 0;
  let latestRequestId = 0;

  const worker = new Worker(new URL("../services/jsonTools/jsonTool.worker.js", import.meta.url), {
    type: "module",
  });

  const revokeOutputUrl = () => {
    if (outputUrl.value) {
      URL.revokeObjectURL(outputUrl.value);
      outputUrl.value = "";
    }
  };

  const resetOutputState = () => {
    outputText.value = "";
    outputBlob.value = null;
    message.value = "";
    error.value = null;
    revokeOutputUrl();
  };

  const ensureInputSize = () => {
    if (
      primaryInput.value.length > MAX_INPUT_CHARS ||
      secondaryInput.value.length > MAX_INPUT_CHARS
    ) {
      throw new Error(
        `Input is too large. Limit is ${MAX_INPUT_CHARS.toLocaleString()} characters.`
      );
    }
  };

  /*
    Worker messages must use structured-clone-safe data only.
    Vue reactive option objects are normalized to plain JSON-compatible objects before postMessage.
  */
  const buildWorkerPayload = (tool) => ({
    toolId: tool.id,
    input: String(primaryInput.value ?? ""),
    secondaryInput: String(secondaryInput.value ?? ""),
    options: JSON.parse(JSON.stringify(options.value || {})),
  });

  const runTool = async ({ force = false } = {}) => {
    const tool = activeTool.value;
    if (!tool) {
      return;
    }

    const needsSecondary = Boolean(tool.secondaryInputMode);
    if (!primaryInput.value.trim()) {
      if (force) {
        error.value = { code: "EMPTY_INPUT", message: "Primary input is required", details: [] };
      }
      return;
    }

    if (needsSecondary && !secondaryInput.value.trim()) {
      if (force) {
        error.value = {
          code: "EMPTY_SECONDARY_INPUT",
          message: "Secondary input is required",
          details: [],
        };
      }
      return;
    }

    loading.value = true;
    error.value = null;
    message.value = "";

    try {
      ensureInputSize();

      if (tool.outputKind === "visual") {
        const result = await renderJsonAsImage({
          toolId: tool.id,
          input: primaryInput.value,
          options: options.value,
        });

        revokeOutputUrl();
        outputBlob.value = result.outputBlob;
        outputUrl.value = result.outputUrl;
        outputText.value = result.outputText;
        message.value = "Visual output generated";
        return;
      }

      requestCounter += 1;
      latestRequestId = requestCounter;
      const currentRequestId = latestRequestId;

      const result = await new Promise((resolve) => {
        const handler = (event) => {
          if (event.data.requestId !== currentRequestId) {
            return;
          }

          worker.removeEventListener("message", handler);
          resolve(event.data.result);
        };

        worker.addEventListener("message", handler);
        worker.postMessage({
          requestId: currentRequestId,
          payload: buildWorkerPayload(tool),
        });
      });

      if (!result.ok) {
        error.value = result.error;
        outputText.value = "";
        return;
      }

      outputText.value = result.outputText;
      const blob = new Blob([result.outputText], { type: result.mimeType || "text/plain" });
      outputBlob.value = blob;
      revokeOutputUrl();
      outputUrl.value = URL.createObjectURL(blob);
      message.value = "Transformation completed";
    } catch (runError) {
      error.value = {
        code: "RUN_FAILED",
        message: runError instanceof Error ? runError.message : "Could not run tool",
        details: [],
      };
    } finally {
      loading.value = false;
    }
  };

  const scheduleRun = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void runTool();
    }, 280);
  };

  watch(
    () => [
      primaryInput.value,
      secondaryInput.value,
      JSON.stringify(options.value),
      autoRun.value,
      activeTool.value?.id,
    ],
    () => {
      resetOutputState();
      if (autoRun.value) {
        scheduleRun();
      }
    }
  );

  watch(
    () => activeTool.value?.id,
    () => {
      options.value = buildDefaultOptions(activeTool.value);
      primaryInput.value = "";
      secondaryInput.value = "";
      resetOutputState();
    }
  );

  const copyOutput = async () => {
    if (!outputText.value) {
      return false;
    }

    await navigator.clipboard.writeText(outputText.value);
    message.value = "Output copied to clipboard";
    return true;
  };

  const downloadFileName = computed(() =>
    buildDownloadName(activeTool.value?.id || "json-output", activeTool.value?.fileExtension)
  );

  const onPrimaryFileSelected = async (file) => {
    if (!file) {
      return;
    }
    primaryInput.value = await file.text();
  };

  const onSecondaryFileSelected = async (file) => {
    if (!file) {
      return;
    }
    secondaryInput.value = await file.text();
  };

  const resetOptions = () => {
    options.value = buildDefaultOptions(activeTool.value);
  };

  const swapInputs = () => {
    const currentPrimary = primaryInput.value;
    primaryInput.value = secondaryInput.value;
    secondaryInput.value = currentPrimary;
  };

  onBeforeUnmount(() => {
    clearTimeout(debounceTimer);
    worker.terminate();
    revokeOutputUrl();
  });

  return {
    primaryInput,
    secondaryInput,
    options,
    outputText,
    outputUrl,
    loading,
    autoRun,
    error,
    message,
    downloadFileName,
    runTool,
    copyOutput,
    onPrimaryFileSelected,
    onSecondaryFileSelected,
    resetOptions,
    swapInputs,
    clearAll: () => {
      primaryInput.value = "";
      secondaryInput.value = "";
      resetOptions();
      resetOutputState();
    },
  };
};
