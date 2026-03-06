<script setup>
/*
  Merge flow now opens a shared success overlay when output is ready.
  The card keeps processing controls while completion actions move to one reusable modal.
*/
import { computed, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePortalI18n } from "../../i18n";
import { usePdfMerge } from "../../composables/usePdfMerge";

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

const {
  files,
  loading,
  error,
  message,
  requestId,
  fileUrl,
  fileName,
  draggingId,
  progressPercent,
  progressLabel,
  selectFiles,
  moveFile,
  startDragging,
  stopDragging,
  dropBefore,
  rotateFile,
  merge,
} = usePdfMerge();

const canMerge = computed(() => props.apiHealthy && files.value.length >= 2 && !loading.value);
const showSuccessModal = ref(false);

watch(fileUrl, (nextUrl, prevUrl) => {
  if (nextUrl && nextUrl !== prevUrl) {
    showSuccessModal.value = true;
    return;
  }

  if (!nextUrl) {
    showSuccessModal.value = false;
  }
});

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

const formatFileSize = (size) => {
  if (!size) {
    return "0 KB";
  }

  return `${(size / 1024).toFixed(1)} KB`;
};
</script>

<template>
  <section aria-labelledby="pdf-merge-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-merge-endpoint" class="section-head__title">{{ t("tools.pdfMerge.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfMerge.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfMerge.step1") }}</p>
        <input type="file" accept="application/pdf" multiple @change="onFilesSelected" />
        <p class="tool-card__description">
          {{ t("tools.pdfMerge.selectedFiles", { count: files.length }) }}
        </p>
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

      <div v-if="files.length" class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfMerge.step2") }}</p>
        <div class="preview-grid">
          <article
            v-for="(entry, index) in files"
            :key="entry.id"
            class="preview-card"
            :class="{ 'preview-card--dragging': draggingId === entry.id }"
            draggable="true"
            @dragstart="startDragging(entry.id)"
            @dragend="stopDragging"
            @dragover.prevent
            @drop="dropBefore(entry.id)"
          >
            <div class="preview-card__head">
              <p class="preview-card__order">
                {{ t("tools.pdfMerge.order", { index: index + 1 }) }}
              </p>
              <p class="preview-card__name" :title="entry.name">{{ entry.name }}</p>
              <p class="preview-card__meta">{{ formatFileSize(entry.size) }}</p>
            </div>

            <div class="pdf-preview-shell">
              <iframe
                :src="`${entry.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
                :title="t('tools.pdfMerge.previewTitle', { name: entry.name })"
                class="pdf-preview"
                :style="{ transform: `rotate(${entry.rotation}deg)` }"
              />
            </div>

            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--icon"
                :disabled="index === 0 || loading"
                :aria-label="t('tools.pdfMerge.moveUp')"
                @click="moveFile(entry.id, 'up')"
              >
                ↑
              </button>
              <button
                type="button"
                class="button button--icon"
                :disabled="index === files.length - 1 || loading"
                :aria-label="t('tools.pdfMerge.moveDown')"
                @click="moveFile(entry.id, 'down')"
              >
                ↓
              </button>
              <label>
                {{ t("tools.pdfMerge.rotatePages") }}
                <select
                  class="rotation-select"
                  :disabled="loading"
                  :value="entry.rotation"
                  @change="rotateFile(entry.id, $event.target.value)"
                >
                  <option :value="0">0°</option>
                  <option :value="90">90°</option>
                  <option :value="180">180°</option>
                  <option :value="270">270°</option>
                </select>
              </label>
            </div>
          </article>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfMerge.step4") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canMerge"
          @click="merge(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.pdfMerge.creating") : t("tools.pdfMerge.create") }}
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
      <p v-if="fileUrl && !showSuccessModal" class="tool-card__description">
        {{ t("tools.pdfMerge.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.pdfMerge.modalTitle')"
        :description="t('tools.pdfMerge.modalDescription')"
        :download-url="fileUrl"
        :download-name="fileName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
