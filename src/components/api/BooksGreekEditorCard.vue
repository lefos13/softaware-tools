<script setup>
/*
  The Books editor card follows the shared service-card pattern while exposing
  the new rule checklist and manuscript-only scope in plain language.
*/
import { computed, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import {
  GREEK_EDITOR_RULES,
  useGreekLiteratureEditor,
} from "../../composables/useGreekLiteratureEditor";
import { usePortalI18n } from "../../i18n";

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
} = useGreekLiteratureEditor();

const canApply = computed(
  () => props.apiHealthy && hasFile.value && hasSelectedRules.value && !loading.value
);
const showSuccessModal = ref(false);

const ruleItems = computed(() =>
  GREEK_EDITOR_RULES.map((ruleId) => ({
    id: ruleId,
    title: t(`tools.booksGreekEditor.rules.${ruleId}.title`),
    description: t(`tools.booksGreekEditor.rules.${ruleId}.description`),
  }))
);

watch(resultUrl, (nextUrl, prevUrl) => {
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
</script>

<template>
  <section aria-labelledby="books-greek-editor">
    <div class="section-head section-head--spaced">
      <h2 id="books-greek-editor" class="section-head__title">
        {{ t("tools.booksGreekEditor.title") }}
      </h2>
      <p class="section-head__subtitle">{{ t("tools.booksGreekEditor.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step1") }}</p>
        <input
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          @change="onFilesSelected"
        />
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

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step2") }}</p>
        <p class="tool-card__description">{{ t("tools.booksGreekEditor.scopeNote") }}</p>
        <p class="selection-pill">
          {{ t("tools.booksGreekEditor.selectedRules", { count: selectedRuleIds.length }) }}
        </p>
        <div class="rule-checkboxes">
          <label
            v-for="rule in ruleItems"
            :key="rule.id"
            class="rule-checkbox"
            :for="`rule-${rule.id}`"
          >
            <span class="rule-checkbox__header">
              <input
                :id="`rule-${rule.id}`"
                :checked="selectedRuleIds.includes(rule.id)"
                type="checkbox"
                :disabled="loading"
                @change="toggleRule(rule.id)"
              />
              <span>
                <span class="rule-checkbox__title">{{ rule.title }}</span>
                <span class="rule-checkbox__description">{{ rule.description }}</span>
              </span>
            </span>
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step3") }}</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canApply"
          @click="applyEditor(props.apiBaseUrl)"
        >
          {{ loading ? t("tools.booksGreekEditor.applying") : t("tools.booksGreekEditor.apply") }}
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
        {{ t("tools.booksGreekEditor.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>
      <SuccessThankYouModal
        :visible="showSuccessModal"
        :title="t('tools.booksGreekEditor.modalTitle')"
        :description="t('tools.booksGreekEditor.modalDescription')"
        :download-url="resultUrl"
        :download-name="resultName"
        @close="closeSuccessModal"
      />
    </div>
  </section>
</template>
