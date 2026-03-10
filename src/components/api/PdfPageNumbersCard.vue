<script setup lang="ts">
/*
  Numbering UI supports both standard page labels and Bates numbering with one
  concise form so legal/admin workflows can be tested quickly.
*/
import { computed, inject, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import { addPdfPageNumbers } from "../../services/pdfService";
import type { PortalI18n } from "../../types/shared";
import type { ServiceFlowShellContext } from "../../types/services";

interface PdfPageNumbersPayload extends Record<string, unknown> {
  mode: "page_numbers" | "bates";
  format?: string;
  prefix?: string;
  startNumber?: number;
  padding?: number;
  position: string;
}

const props = defineProps<{
  apiBaseUrl: string;
  apiHealthy: boolean;
}>();
const { t } = usePortalI18n() as PortalI18n;
const serviceFlowShell = inject<ServiceFlowShellContext | null>("serviceFlowShell", null);

const file = ref<File | null>(null);
const mode = ref<"page_numbers" | "bates">("page_numbers");
const format = ref("Page {page} of {total}");
const prefix = ref("CASE-");
const startNumber = ref(1);
const padding = ref(6);
const position = ref("bottom-right");
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

/*
  Numbering uses inline downloads, but the shared shell still needs explicit
  loading/result updates so the current step changes at the right moment.
*/
watch(
  () => loading.value,
  (nextValue) => {
    serviceFlowShell?.setLoading(nextValue);
  },
  { immediate: true }
);

watch(
  () => Boolean(outputUrl.value),
  (nextValue) => {
    serviceFlowShell?.setHasResult(nextValue);
  },
  { immediate: true }
);

const canRun = computed(() => props.apiHealthy && file.value && !loading.value);

const onFileSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  const [selected] = Array.from(input?.files || []);
  file.value = selected || null;
  error.value = "";
};

const clearPreviousResult = (): void => {
  if (outputUrl.value) {
    URL.revokeObjectURL(outputUrl.value);
  }

  outputUrl.value = "";
  outputName.value = "";
  message.value = "";
  requestId.value = "";
};

const run = async (): Promise<void> => {
  clearPreviousResult();
  error.value = "";

  if (!file.value) {
    error.value = t("tools.errors.selectPdfFirst");
    return;
  }

  loading.value = true;
  try {
    const payload: PdfPageNumbersPayload =
      mode.value === "bates"
        ? {
            mode: "bates",
            prefix: prefix.value,
            startNumber: Number(startNumber.value),
            padding: Number(padding.value),
            position: position.value,
          }
        : {
            mode: "page_numbers",
            format: format.value,
            position: position.value,
          };

    const result = await addPdfPageNumbers(props.apiBaseUrl, file.value, payload);
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("tools.errors.pageNumberingFailed");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF page numbers">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("tools.pdfPageNumbers.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfPageNumbers.subtitle") }}</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfPageNumbers.sourcePdf") }}</p>
        <input type="file" accept="application/pdf" @change="onFileSelected" />
      </div>

      <div class="merge-step">
        <label>
          {{ t("tools.pdfPageNumbers.mode") }}
          <select v-model="mode" class="rotation-select">
            <option value="page_numbers">{{ t("tools.pdfPageNumbers.modePageNumbers") }}</option>
            <option value="bates">{{ t("tools.pdfPageNumbers.modeBates") }}</option>
          </select>
        </label>
      </div>

      <div v-if="mode === 'page_numbers'" class="merge-step">
        <label>
          {{ t("tools.pdfPageNumbers.format") }}
          <input v-model="format" type="text" class="rotation-select" />
        </label>
        <p class="tool-card__description">{{ t("tools.pdfPageNumbers.formatHelp") }}</p>
      </div>

      <div v-else class="merge-step advanced-grid">
        <label>
          {{ t("tools.pdfPageNumbers.prefix") }}
          <input v-model="prefix" type="text" class="rotation-select" />
        </label>
        <label>
          {{ t("tools.pdfPageNumbers.startNumber") }}
          <input v-model.number="startNumber" type="number" min="1" class="rotation-select" />
        </label>
        <label>
          {{ t("tools.pdfPageNumbers.padding") }}
          <input v-model.number="padding" type="number" min="1" max="16" class="rotation-select" />
        </label>
      </div>

      <div class="merge-step">
        <label>
          {{ t("tools.pdfPageNumbers.position") }}
          <select v-model="position" class="rotation-select">
            <option value="bottom-right">{{ t("tools.positions.bottom-right") }}</option>
            <option value="bottom-left">{{ t("tools.positions.bottom-left") }}</option>
            <option value="bottom-center">{{ t("tools.positions.bottom-center") }}</option>
            <option value="top-right">{{ t("tools.positions.top-right") }}</option>
            <option value="top-left">{{ t("tools.positions.top-left") }}</option>
            <option value="top-center">{{ t("tools.positions.top-center") }}</option>
          </select>
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? t("tools.pdfPageNumbers.applying") : t("tools.pdfPageNumbers.apply") }}
        </button>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        {{ t("tools.common.requestReference") }}: <code>{{ requestId }}</code>
      </p>
      <p v-if="outputUrl" class="tool-card__description">
        {{ t("app.readyPrefix") }}:
        <a :href="outputUrl" :download="outputName">{{
          t("tools.common.download", { name: outputName })
        }}</a>
      </p>
    </article>
  </section>
</template>
