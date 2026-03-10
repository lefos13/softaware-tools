<script setup lang="ts">
/*
  Text extraction UI exposes merged TXT output by default with an explicit
  per-page ZIP option for workflows needing page-level separation.
*/
import { computed, inject, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import { extractPdfText } from "../../services/pdfService";
import type { PortalI18n } from "../../types/shared";
import type { ServiceFlowShellContext } from "../../types/services";

const props = defineProps<{
  apiBaseUrl: string;
  apiHealthy: boolean;
}>();
const { t } = usePortalI18n() as PortalI18n;
const serviceFlowShell = inject<ServiceFlowShellContext | null>("serviceFlowShell", null);

const file = ref<File | null>(null);
const perPageZip = ref(false);
const includePageHeaders = ref(true);
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

/*
  Text extraction stays on a simple inline result view, so it forwards state
  changes to the shell instead of relying on local step labels.
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
    const result = await extractPdfText(props.apiBaseUrl, file.value, {
      perPageZip: perPageZip.value,
      includePageHeaders: includePageHeaders.value,
    });
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("tools.errors.extractTextFailed");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF extract text">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("tools.pdfExtractText.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfExtractText.subtitle") }}</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfExtractText.sourcePdf") }}</p>
        <input type="file" accept="application/pdf" @change="onFileSelected" />
      </div>

      <div class="merge-step">
        <label class="checkbox-row">
          <input v-model="perPageZip" type="checkbox" />
          {{ t("tools.pdfExtractText.perPageZip") }}
        </label>
        <label class="checkbox-row">
          <input v-model="includePageHeaders" type="checkbox" :disabled="perPageZip" />
          {{ t("tools.pdfExtractText.includePageHeaders") }}
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? t("tools.pdfExtractText.extracting") : t("tools.pdfExtractText.extract") }}
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

<style src="./PdfExtractTextCard.scss" lang="scss"></style>
