<script setup lang="ts">
/*
  Extraction flow now reuses the shared success overlay for completion actions.
  The result download and donation prompt stay consistent with all other services.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePortalI18n } from "../../i18n";
import { usePdfExtractToWord } from "../../composables/usePdfExtractToWord";
import type { PortalI18n } from "../../types/shared";
import type { ServiceFlowShellContext } from "../../types/services";

const props = defineProps<{
  apiBaseUrl: string;
  apiHealthy: boolean;
}>();
const { t } = usePortalI18n() as PortalI18n;
const serviceFlowShell = inject<ServiceFlowShellContext | null>("serviceFlowShell", null);

const {
  file,
  filePreviewUrl,
  includePageBreaks,
  includeOcrUsageNotes,
  languageMode,
  extractionQualityMode,
  loading,
  error,
  message,
  requestId,
  resultUrl,
  resultName,
  progressPercent,
  progressLabel,
  hasFile,
  selectFiles,
  extract,
} = usePdfExtractToWord();

const canExtract = computed(() => props.apiHealthy && hasFile.value && !loading.value);
const showSuccessModal = ref(false);

watch(resultUrl, (nextUrl, prevUrl) => {
  if (nextUrl && nextUrl !== prevUrl) {
    showSuccessModal.value = true;
    return;
  }

  if (!nextUrl) {
    showSuccessModal.value = false;
  }
});

/*
  The extract-to-Word card reports loading and completed output back to the
  shell so the shared stepper reflects the same state as the modal flow.
*/
watch(
  () => loading.value,
  (nextValue) => {
    serviceFlowShell?.setLoading(nextValue);
  },
  { immediate: true }
);

watch(
  () => Boolean(resultUrl.value),
  (nextValue) => {
    serviceFlowShell?.setHasResult(nextValue);
  },
  { immediate: true }
);

const onFilesSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  selectFiles(Array.from(input?.files || []));
};

const closeSuccessModal = (): void => {
  showSuccessModal.value = false;
};
</script>

<template>
  <section aria-labelledby="pdf-extract-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-extract-endpoint" class="section-head__title">
        {{ t("tools.pdfToWord.title") }}
      </h2>
      <p class="section-head__subtitle">{{ t("tools.pdfToWord.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfToWord.step1") }}</p>
        <input type="file" accept="application/pdf" @change="onFilesSelected" />
        <p class="tool-card__description">
          {{ t("tools.common.selected", { value: file ? file.name : t("app.none") }) }}
        </p>
        <p class="tool-card__description">
          {{
            t("app.singleFileUploadLimits", {
              files: MAX_UPLOAD_FILES,
              fileSize: MAX_FILE_SIZE_MB,
              totalSize: MAX_TOTAL_UPLOAD_MB,
            })
          }}
        </p>
      </div>

      <div v-if="filePreviewUrl" class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfToWord.sourcePreview") }}</p>
        <div class="pdf-preview-shell pdf-preview-shell--split">
          <iframe
            :src="`${filePreviewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
            :title="t('tools.pdfToWord.sourcePreview')"
            class="pdf-preview"
          />
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfToWord.step2") }}</p>

        <label>
          {{ t("tools.pdfToWord.documentLanguage") }}
          <select v-model="languageMode" class="rotation-select" :disabled="loading">
            <option value="en">{{ t("tools.extractionLanguages.en") }}</option>
            <option value="gr">{{ t("tools.extractionLanguages.gr") }}</option>
            <option value="both">{{ t("tools.extractionLanguages.both") }}</option>
          </select>
        </label>
        <p class="tool-card__description">{{ t("tools.pdfToWord.languageHelp") }}</p>

        <label>
          {{ t("tools.pdfToWord.readingQuality") }}
          <select v-model="extractionQualityMode" class="rotation-select" :disabled="loading">
            <option value="fast">{{ t("tools.extractionQuality.fast") }}</option>
            <option value="quality">{{ t("tools.extractionQuality.quality") }}</option>
            <option value="maximum">{{ t("tools.extractionQuality.maximum") }}</option>
            <option value="ultra">{{ t("tools.extractionQuality.ultra") }}</option>
          </select>
        </label>
        <p class="tool-card__description">{{ t("tools.pdfToWord.qualityHelp") }}</p>

        <div class="advanced-grid">
          <label class="advanced-checkbox">
            <input v-model="includePageBreaks" type="checkbox" :disabled="loading" />
            {{ t("tools.pdfToWord.keepPageBreaks") }}
          </label>
          <label class="advanced-checkbox">
            <input v-model="includeOcrUsageNotes" type="checkbox" :disabled="loading" />
            {{ t("tools.pdfToWord.addOcrNotes") }}
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfToWord.step3") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canExtract"
          @click="extract(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.pdfToWord.creating") : t("tools.pdfToWord.create") }}
        </button>
        <p v-if="!apiHealthy" class="tool-card__description tool-card__description--error">
          {{ t("app.serverOfflineAction") }}
        </p>

        <div v-if="loading" class="progress-panel" aria-live="polite">
          <div class="progress-panel__head">
            <strong>{{ progressLabel }}</strong>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-track__bar" :style="{ width: `${progressPercent}%` }" />
          </div>
        </div>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        {{ t("tools.common.requestReference") }}: <code>{{ requestId }}</code>
      </p>
      <p v-if="resultUrl && !showSuccessModal" class="tool-card__description">
        {{ t("tools.pdfToWord.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.pdfToWord.modalTitle')"
        :description="t('tools.pdfToWord.modalDescription')"
        :download-url="resultUrl"
        :download-name="resultName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
