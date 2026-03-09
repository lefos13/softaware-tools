<script setup>
/*
  Conversion flow now shows completion through the shared success overlay.
  This keeps the download + donation experience consistent with the other tools.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePortalI18n } from "../../i18n";
import { useImageConversion } from "../../composables/useImageConversion";

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
  targetFormat,
  conversionOptions,
  loading,
  error,
  message,
  requestId,
  archiveUrl,
  archiveName,
  originalPreviewUrl,
  formattedPreviewUrl,
  formattedPreviewName,
  progressPercent,
  progressLabel,
  selectFiles,
  setBackgroundSeed,
  clearBackgroundSeeds,
  convert,
} = useImageConversion();

const supportsTransparency = computed(() =>
  ["png", "webp", "avif", "tiff", "gif"].includes(targetFormat.value)
);

const isPickerMode = computed(
  () =>
    conversionOptions.value.transparentBackground &&
    conversionOptions.value.backgroundDetectionMode === "picker"
);

const pickerPoints = computed(() => conversionOptions.value.pickerPoints || []);

const singleFileTransparentRuleSatisfied = computed(
  () => !conversionOptions.value.transparentBackground || files.value.length === 1
);

const canConvert = computed(
  () =>
    props.apiHealthy &&
    files.value.length > 0 &&
    !loading.value &&
    singleFileTransparentRuleSatisfied.value
);
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
  The conversion card updates the shared stepper from its archive lifecycle so
  result review appears only after an actual conversion attempt has produced output.
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

const originalPreviewImageRef = ref(null);

const onOriginalPreviewClick = (event) => {
  if (!isPickerMode.value) {
    return;
  }

  const imageElement = originalPreviewImageRef.value;
  if (!imageElement) {
    return;
  }

  const rect = imageElement.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    return;
  }

  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  setBackgroundSeed({ x, y });
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};
</script>

<template>
  <section aria-labelledby="image-convert-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="image-convert-endpoint" class="section-head__title">
        {{ t("tools.imageConvert.title") }}
      </h2>
      <p class="section-head__subtitle">{{ t("tools.imageConvert.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageConvert.step1") }}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff"
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
        <p v-if="conversionOptions.transparentBackground" class="tool-card__description">
          {{ t("tools.imageConvert.transparentNeedsOne") }}
        </p>
        <p
          v-if="conversionOptions.transparentBackground && !singleFileTransparentRuleSatisfied"
          class="tool-card__description tool-card__description--error"
        >
          {{ t("tools.imageConvert.transparentNeedsOneError") }}
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageConvert.step2") }}</p>
        <select v-model="targetFormat" class="rotation-select" :disabled="loading">
          <option value="jpeg">{{ t("tools.formatLabels.jpeg") }}</option>
          <option value="png">{{ t("tools.formatLabels.png") }}</option>
          <option value="webp">{{ t("tools.formatLabels.webp") }}</option>
          <option value="avif">{{ t("tools.formatLabels.avif") }}</option>
          <option value="tiff">{{ t("tools.formatLabels.tiff") }}</option>
          <option value="gif">{{ t("tools.formatLabels.gif") }}</option>
        </select>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageConvert.step3") }}</p>
        <div class="advanced-grid">
          <label>
            {{ t("tools.imageConvert.quality") }}
            <input
              v-model.number="conversionOptions.quality"
              type="number"
              min="1"
              max="100"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
          <label>
            {{ t("tools.imageConvert.effort") }}
            <input
              v-model.number="conversionOptions.effort"
              type="number"
              min="0"
              max="9"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
          <label class="advanced-checkbox">
            <input v-model="conversionOptions.lossless" type="checkbox" :disabled="loading" />
            {{ t("tools.imageConvert.lossless") }}
          </label>
          <label class="advanced-checkbox">
            <input
              v-model="conversionOptions.transparentBackground"
              type="checkbox"
              :disabled="loading || !supportsTransparency"
            />
            {{ t("tools.imageConvert.transparent") }}
          </label>
        </div>

        <div v-if="conversionOptions.transparentBackground" class="advanced-grid">
          <label>
            {{ t("tools.imageConvert.backgroundSelection") }}
            <select
              v-model="conversionOptions.backgroundDetectionMode"
              class="rotation-select"
              :disabled="loading"
            >
              <option value="auto">{{ t("tools.imageConvert.backgroundAuto") }}</option>
              <option value="picker">{{ t("tools.imageConvert.backgroundPicker") }}</option>
            </select>
          </label>
          <label>
            {{ t("tools.imageConvert.colorTolerance") }}
            <input
              v-model.number="conversionOptions.colorTolerance"
              type="number"
              min="0"
              max="255"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
        </div>

        <p class="tool-card__description">
          {{ t("tools.imageConvert.backgroundHelp") }}
        </p>
        <p v-if="!supportsTransparency" class="tool-card__description">
          {{ t("tools.imageConvert.noTransparency") }}
        </p>
      </div>

      <div v-if="originalPreviewUrl || formattedPreviewUrl" class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageConvert.step4") }}</p>
        <div class="image-preview-grid">
          <figure v-if="originalPreviewUrl" class="image-preview-card">
            <figcaption class="image-preview-card__label">
              {{ t("tools.imageConvert.original") }}
            </figcaption>
            <div
              class="image-preview-shell"
              :class="{ 'image-preview-shell--picker': isPickerMode }"
              @click="onOriginalPreviewClick"
            >
              <div class="image-preview-stage">
                <img
                  ref="originalPreviewImageRef"
                  class="image-preview-image"
                  :src="originalPreviewUrl"
                  :alt="t('tools.imageConvert.previewAltOriginal')"
                />
                <span
                  v-for="(point, index) in isPickerMode ? pickerPoints : []"
                  :key="`${point.x}-${point.y}-${index}`"
                  class="image-picker-dot"
                  :style="{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }"
                />
              </div>
            </div>
            <p v-if="isPickerMode" class="tool-card__description">
              {{ t("tools.imageConvert.pickerHelp") }}
            </p>
            <p v-if="isPickerMode && pickerPoints.length > 0" class="tool-card__description">
              {{ t("tools.imageConvert.selectedPoints", { count: pickerPoints.length }) }}
              <button
                type="button"
                class="button"
                :disabled="loading"
                @click="clearBackgroundSeeds"
              >
                {{ t("tools.imageConvert.clearPoints") }}
              </button>
            </p>
          </figure>

          <figure v-if="formattedPreviewUrl" class="image-preview-card">
            <figcaption class="image-preview-card__label">
              {{ t("tools.imageConvert.converted") }}
            </figcaption>
            <div class="image-preview-shell image-preview-shell--checker">
              <div class="image-preview-stage">
                <img
                  class="image-preview-image"
                  :src="formattedPreviewUrl"
                  :alt="t('tools.imageConvert.previewAltConverted')"
                />
              </div>
            </div>
            <p v-if="formattedPreviewName" class="tool-card__description">
              {{ formattedPreviewName }}
            </p>
          </figure>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.imageConvert.step5") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canConvert"
          @click="convert(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.imageConvert.creating") : t("tools.imageConvert.create") }}
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
        {{ t("tools.imageConvert.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.imageConvert.modalTitle')"
        :description="t('tools.imageConvert.modalDescription')"
        :download-url="archiveUrl"
        :download-name="archiveName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
