<script setup>
/*
  Split flow now shares the same completion overlay with other services.
  Result download and donation prompt are shown through one reusable modal component.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePortalI18n } from "../../i18n";
import { usePdfSplit } from "../../composables/usePdfSplit";

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
} = usePdfSplit();

const canSplit = computed(() => props.apiHealthy && Boolean(file.value) && !loading.value);
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
  The wrapper tracks per-card progress through injected setters so only the
  active stage in the shared stepper is highlighted while users work.
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
  <section aria-labelledby="pdf-split-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-split-endpoint" class="section-head__title">{{ t("tools.pdfSplit.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfSplit.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step1") }}</p>
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
        <p class="merge-step__title">{{ t("tools.pdfSplit.sourcePreview") }}</p>
        <div class="pdf-preview-shell pdf-preview-shell--split">
          <iframe
            :src="`${filePreviewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
            :title="t('tools.pdfSplit.sourcePreview')"
            class="pdf-preview"
          />
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step2") }}</p>
        <select v-model="mode" class="rotation-select" :disabled="loading">
          <option value="range">{{ t("tools.pdfSplit.range") }}</option>
          <option value="selected_pages">{{ t("tools.pdfSplit.selectedPages") }}</option>
          <option value="every_n_pages">{{ t("tools.pdfSplit.everyNPages") }}</option>
          <option value="custom_groups">{{ t("tools.pdfSplit.customGroups") }}</option>
        </select>
      </div>

      <div v-if="mode === 'range'" class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step3Range") }}</p>
        <div class="advanced-grid">
          <label>
            {{ t("tools.pdfSplit.startPage") }}
            <input
              v-model.number="rangeOptions.fromPage"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            {{ t("tools.pdfSplit.endPage") }}
            <input
              v-model.number="rangeOptions.toPage"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
        </div>
      </div>

      <div v-else-if="mode === 'selected_pages'" class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step3Pages") }}</p>
        <label>
          {{ t("tools.pdfSplit.pageNumbers") }}
          <input
            v-model="selectedPagesInput"
            type="text"
            class="rotation-select"
            placeholder="1,5,10"
            :disabled="loading"
          />
        </label>
        <p class="tool-card__description">{{ t("tools.pdfSplit.pageNumbersHelp") }}</p>
      </div>

      <div v-else-if="mode === 'every_n_pages'" class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step3Size") }}</p>
        <label>
          {{ t("tools.pdfSplit.pagesPerFile") }}
          <input
            v-model.number="chunkSize"
            type="number"
            min="1"
            class="rotation-select"
            :disabled="loading"
          />
        </label>
      </div>

      <div v-else class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step3Groups") }}</p>
        <div class="advanced-grid">
          <article v-for="group in customGroups" :key="group.id" class="preview-card">
            <div class="preview-card__head">
              <p class="preview-card__order">
                {{ t("tools.pdfSplit.groupLabel", { id: group.id }) }}
              </p>
            </div>
            <div class="advanced-grid">
              <label>
                {{ t("tools.pdfSplit.groupName") }}
                <input
                  v-model="group.name"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
              <label>
                {{ t("tools.pdfSplit.ranges") }}
                <input
                  v-model="group.rangesInput"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
              <label>
                {{ t("tools.pdfSplit.pages") }}
                <input
                  v-model="group.pagesInput"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
            </div>
            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--secondary"
                :disabled="loading || !canRemoveCustomGroup"
                @click="removeCustomGroup(group.id)"
              >
                {{ t("tools.pdfSplit.removeGroup") }}
              </button>
            </div>
          </article>
        </div>

        <div class="preview-card__actions">
          <button
            type="button"
            class="button button--secondary"
            :disabled="loading"
            @click="addCustomGroup"
          >
            {{ t("tools.pdfSplit.addGroup") }}
          </button>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfSplit.step4") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canSplit"
          @click="split(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.pdfSplit.creating") : t("tools.pdfSplit.create") }}
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
        {{ t("tools.pdfSplit.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.pdfSplit.modalTitle')"
        :description="t('tools.pdfSplit.modalDescription')"
        :download-url="archiveUrl"
        :download-name="archiveName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
