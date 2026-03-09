<script setup>
/*
  Compression flow now uses the shared success overlay to keep completion behavior aligned.
  It centralizes download and donation actions instead of duplicating inline sections.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePortalI18n } from "../../i18n";
import { useImageCompression } from "../../composables/useImageCompression";

const props = defineProps({
  apiBaseUrl: {
    type: String,
    required: true,
  },
  apiHealthy: {
    type: Boolean,
    required: true,
  },
});
const { t } = usePortalI18n();
const serviceFlowShell = inject("serviceFlowShell", null);

const {
  files,
  mode,
  advancedOptions,
  loading,
  error,
  message,
  requestId,
  archiveUrl,
  archiveName,
  progressPercent,
  progressLabel,
  selectFiles,
  compress,
} = useImageCompression();

const canCompress = computed(() => props.apiHealthy && files.value.length > 0 && !loading.value);
const showSuccessModal = ref(false);

watch(archiveUrl, (nextUrl, prevUrl) => {
  if (nextUrl && nextUrl !== prevUrl) {
    showSuccessModal.value = true;
    return;
  }

  if (!nextUrl) {
    showSuccessModal.value = false;
  }
});

/*
  Compression runs can finish through the modal, so the shell receives the
  same loading/result signals directly from this card for correct step state.
*/
watch(
  () => loading.value,
  (nextValue) => {
    serviceFlowShell?.setLoading(nextValue);
  },
  { immediate: true }
);

watch(
  () => Boolean(archiveUrl.value),
  (nextValue) => {
    serviceFlowShell?.setHasResult(nextValue);
  },
  { immediate: true }
);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};
</script>

<template>
  <section aria-labelledby="image-compress-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="image-compress-endpoint" class="section-head__title">
        {{ t("tools.imageCompression.title") }}
      </h2>
      <p class="section-head__subtitle">{{ t("tools.imageCompression.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageCompression.step1") }}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          @change="onFilesSelected"
        />
        <p class="tool-card__description">{{ t("app.selectedFiles") }}: {{ files.length }}</p>
        <p class="tool-card__description">
          {{
            t("app.uploadLimits", {
              files: MAX_UPLOAD_FILES,
              fileSize: MAX_FILE_SIZE_MB,
              totalSize: MAX_TOTAL_UPLOAD_MB,
            })
          }}
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageCompression.step2") }}</p>
        <select v-model="mode" class="rotation-select" :disabled="loading">
          <option value="light">{{ t("tools.imageCompression.modeLight") }}</option>
          <option value="balanced">{{ t("tools.imageCompression.modeBalanced") }}</option>
          <option value="aggressive">{{ t("tools.imageCompression.modeAggressive") }}</option>
          <option value="advanced">{{ t("tools.imageCompression.modeAdvanced") }}</option>
        </select>
      </div>

      <div v-if="mode === 'advanced'" class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageCompression.customSettings") }}</p>
        <div class="advanced-grid">
          <label>
            {{ t("tools.imageCompression.quality") }}
            <input
              v-model.number="advancedOptions.quality"
              type="number"
              min="1"
              max="100"
              class="rotation-select"
            />
          </label>
          <label>
            {{ t("tools.imageCompression.outputFormat") }}
            <select v-model="advancedOptions.format" class="rotation-select">
              <option value="jpeg">{{ t("tools.formatLabels.jpeg") }}</option>
              <option value="png">{{ t("tools.formatLabels.png") }}</option>
              <option value="webp">{{ t("tools.formatLabels.webp") }}</option>
              <option value="avif">{{ t("tools.formatLabels.avif") }}</option>
            </select>
          </label>
          <label>
            {{ t("tools.imageCompression.maxWidth") }}
            <input
              v-model.number="advancedOptions.maxWidth"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            {{ t("tools.imageCompression.maxHeight") }}
            <input
              v-model.number="advancedOptions.maxHeight"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            {{ t("tools.imageCompression.effort") }}
            <input
              v-model.number="advancedOptions.effort"
              type="number"
              min="0"
              max="9"
              class="rotation-select"
            />
          </label>
          <label class="advanced-checkbox">
            <input v-model="advancedOptions.lossless" type="checkbox" />
            {{ t("tools.imageCompression.lossless") }}
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageCompression.step3") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canCompress"
          @click="compress(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.imageCompression.creating") : t("tools.imageCompression.create") }}
        </button>

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
      <p v-if="archiveUrl && !showSuccessModal" class="tool-card__description">
        {{ t("tools.imageCompression.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.imageCompression.modalTitle')"
        :description="t('tools.imageCompression.modalDescription')"
        :download-url="archiveUrl"
        :download-name="archiveName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
