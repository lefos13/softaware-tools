<script setup>
/*
  The Books editor card exposes both manuscript uploads and pasted text while
  keeping grouped rules, examples, preferences, and result handling in one flow.
*/
import { computed, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { BOOKS_GREEK_EDITOR_PREFERENCES } from "../../config/booksGreekEditorRules";
import { useGreekLiteratureEditor } from "../../composables/useGreekLiteratureEditor";
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
  inputMode,
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
  hasInput,
  hasSelectedRules,
  hasBinaryResult,
  hasTextResult,
  setInputMode,
  selectFiles,
  setInputText,
  toggleRule,
  setAllRules,
  setPreference,
  setIncludeReport,
  applyEditor,
} = useGreekLiteratureEditor();

const canApply = computed(
  () => props.apiHealthy && hasInput.value && hasSelectedRules.value && !loading.value
);
const showSuccessModal = ref(false);

const sectionItems = computed(() =>
  ["literary", "orthography", "preferences"].map((sectionId) => ({
    id: sectionId,
    open: sectionId === "literary",
    title: t(`tools.booksGreekEditor.sections.${sectionId}.title`),
    description: t(`tools.booksGreekEditor.sections.${sectionId}.description`),
    rules: (rulesBySection.value[sectionId] || []).map((rule) => ({
      ...rule,
      title: t(`tools.booksGreekEditor.rules.${rule.id}.title`),
      description: t(`tools.booksGreekEditor.rules.${rule.id}.description`),
      example: t(`tools.booksGreekEditor.rules.${rule.id}.example`),
      cases: t(`tools.booksGreekEditor.rules.${rule.id}.cases`),
      preferenceLabel: rule.preferenceKey
        ? t(`tools.booksGreekEditor.preferences.${rule.preferenceKey}.label`)
        : "",
      preferenceOptions: rule.preferenceKey
        ? BOOKS_GREEK_EDITOR_PREFERENCES[rule.preferenceKey].options.map((option) => ({
            value: option,
            label: t(`tools.booksGreekEditor.preferences.${rule.preferenceKey}.options.${option}`),
          }))
        : [],
    })),
  }))
);

const reportGroups = computed(() => {
  const report = reportData?.value;
  if (!report || !Array.isArray(report.changes) || report.changes.length === 0) {
    return [];
  }

  const grouped = new Map();

  report.changes.forEach((change) => {
    if (!grouped.has(change.ruleId)) {
      grouped.set(change.ruleId, {
        ruleId: change.ruleId,
        title: t(`tools.booksGreekEditor.rules.${change.ruleId}.title`),
        count: 0,
        changes: [],
      });
    }

    const entry = grouped.get(change.ruleId);
    entry.count += 1;
    entry.changes.push(change);
  });

  return Array.from(grouped.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.title.localeCompare(right.title, "el");
  });
});

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

const onInputModeChange = (event) => {
  setInputMode(event.target.value);
};

const onTextInput = (event) => {
  setInputText(event.target.value);
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

    <div class="tool-card books-editor-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step1") }}</p>
        <div
          class="mode-toggle"
          role="radiogroup"
          :aria-label="t('tools.booksGreekEditor.inputMode')"
        >
          <label class="mode-toggle__option" for="books-input-docx">
            <input
              id="books-input-docx"
              type="radio"
              name="books-input-mode"
              value="docx"
              :checked="inputMode === 'docx'"
              :disabled="loading"
              @change="onInputModeChange"
            />
            <span>{{ t("tools.booksGreekEditor.modes.docx") }}</span>
          </label>
          <label class="mode-toggle__option" for="books-input-text">
            <input
              id="books-input-text"
              type="radio"
              name="books-input-mode"
              value="text"
              :checked="inputMode === 'text'"
              :disabled="loading"
              @change="onInputModeChange"
            />
            <span>{{ t("tools.booksGreekEditor.modes.text") }}</span>
          </label>
        </div>

        <template v-if="inputMode === 'docx'">
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
          <p class="tool-card__description">{{ t("tools.booksGreekEditor.scopeNote") }}</p>
        </template>

        <template v-else>
          <textarea
            class="books-editor-card__textarea"
            :value="inputText"
            :placeholder="t('tools.booksGreekEditor.textPlaceholder')"
            :disabled="loading"
            rows="10"
            @input="onTextInput"
          />
          <p class="tool-card__description">{{ t("tools.booksGreekEditor.textModeNote") }}</p>
        </template>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step2") }}</p>
        <label class="checkbox-row" for="books-select-all-rules">
          <input
            id="books-select-all-rules"
            type="checkbox"
            :checked="allRulesSelected"
            :disabled="loading"
            @change="setAllRules($event.target.checked)"
          />
          <span>
            <strong>{{ t("tools.booksGreekEditor.selectAllRules") }}</strong>
            <span class="checkbox-row__description">
              {{ t("tools.booksGreekEditor.selectAllRulesHelp") }}
            </span>
          </span>
        </label>
        <p class="selection-pill">
          {{ t("tools.booksGreekEditor.selectedRules", { count: selectedRuleIds.length }) }}
        </p>

        <div v-for="section in sectionItems" :key="section.id" class="rule-section">
          <details class="rule-section__details" :open="section.open">
            <summary class="rule-section__summary">
              <span class="rule-section__summary-copy">
                <span class="rule-section__title">{{ section.title }}</span>
                <span class="rule-section__description">{{ section.description }}</span>
              </span>
              <span class="rule-section__chevron" aria-hidden="true">▾</span>
            </summary>

            <div class="rule-checkboxes">
              <label
                v-for="rule in section.rules"
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
                  <span class="rule-checkbox__copy">
                    <span class="rule-checkbox__title">{{ rule.title }}</span>
                    <span class="rule-checkbox__description">{{ rule.description }}</span>
                  </span>
                </span>

                <div v-if="rule.preferenceKey" class="rule-checkbox__preference">
                  <label class="rule-checkbox__preference-label" :for="`${rule.id}-preference`">
                    {{ rule.preferenceLabel }}
                  </label>
                  <select
                    :id="`${rule.id}-preference`"
                    class="rule-checkbox__select"
                    :value="preferences[rule.preferenceKey]"
                    :disabled="loading"
                    @change="setPreference(rule.preferenceKey, $event.target.value)"
                  >
                    <option
                      v-for="option in rule.preferenceOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <details class="rule-checkbox__details">
                  <summary>{{ t("tools.booksGreekEditor.ruleHelp") }}</summary>
                  <p class="rule-checkbox__details-line">
                    <strong>{{ t("tools.booksGreekEditor.exampleLabel") }}:</strong>
                    {{ rule.example }}
                  </p>
                  <p v-if="rule.cases" class="rule-checkbox__details-line">
                    <strong>{{ t("tools.booksGreekEditor.casesLabel") }}:</strong>
                    {{ rule.cases }}
                  </p>
                </details>
              </label>
            </div>
          </details>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step3") }}</p>
        <label class="checkbox-row" for="books-include-report">
          <input
            id="books-include-report"
            type="checkbox"
            :checked="includeReport"
            :disabled="loading"
            @change="setIncludeReport($event.target.checked)"
          />
          <span>
            <strong>{{ t("tools.booksGreekEditor.includeReport") }}</strong>
            <span class="checkbox-row__description">
              {{ t("tools.booksGreekEditor.includeReportHelp") }}
            </span>
          </span>
        </label>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.booksGreekEditor.step4") }}</p>
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

      <p v-if="hasBinaryResult && !showSuccessModal" class="tool-card__description">
        {{ t("tools.booksGreekEditor.ready") }}
        <button type="button" class="button button--secondary" @click="showSuccessModal = true">
          {{ t("app.openDownloadModal") }}
        </button>
      </p>

      <div v-if="hasTextResult" class="books-result-panel">
        <div class="books-result-panel__header">
          <h3 class="books-result-panel__title">
            {{ t("tools.booksGreekEditor.textResultTitle") }}
          </h3>
          <a
            v-if="resultTextUrl"
            class="button button--secondary"
            :href="resultTextUrl"
            :download="resultTextName"
          >
            {{ t("tools.booksGreekEditor.downloadCorrectedText") }}
          </a>
        </div>

        <textarea class="books-editor-card__textarea" :value="resultText" rows="10" readonly />
      </div>

      <div v-if="reportData || reportText" class="books-result-panel books-result-panel__report">
        <div class="books-result-panel__header">
          <h3 class="books-result-panel__title">{{ t("tools.booksGreekEditor.reportTitle") }}</h3>
          <a
            v-if="reportUrl"
            class="button button--secondary"
            :href="reportUrl"
            :download="reportName"
          >
            {{ t("tools.booksGreekEditor.downloadReport") }}
          </a>
        </div>

        <div v-if="reportData" class="report-summary">
          <div class="report-summary__stats">
            <article class="report-stat">
              <strong>{{ reportData.summary?.totalReplacements || 0 }}</strong>
              <span>{{ t("tools.booksGreekEditor.reportStats.totalChanges") }}</span>
            </article>
            <article class="report-stat">
              <strong>{{ reportGroups.length }}</strong>
              <span>{{ t("tools.booksGreekEditor.reportStats.rulesTouched") }}</span>
            </article>
            <article v-if="reportData.summary?.changedParagraphs" class="report-stat">
              <strong>{{ reportData.summary.changedParagraphs }}</strong>
              <span>{{ t("tools.booksGreekEditor.reportStats.changedParagraphs") }}</span>
            </article>
          </div>

          <div class="report-groups">
            <details v-for="group in reportGroups" :key="group.ruleId" class="report-group">
              <summary class="report-group__header">
                <span>
                  <strong>{{ group.title }}</strong>
                  <span class="report-group__count">
                    {{ t("tools.booksGreekEditor.reportOccurrences", { count: group.count }) }}
                  </span>
                </span>
                <span class="rule-section__chevron" aria-hidden="true">▾</span>
              </summary>
              <div class="report-group__examples">
                <article
                  v-for="(change, index) in group.changes"
                  :key="`${group.ruleId}-${index}`"
                  class="report-example"
                >
                  <div class="report-example__tokens">
                    <span class="report-example__before">{{ change.before }}</span>
                    <span class="report-example__arrow">→</span>
                    <span class="report-example__after">{{ change.after }}</span>
                  </div>
                  <div class="report-example__sentences">
                    <p class="report-example__sentence">
                      <strong>{{ t("tools.booksGreekEditor.reportSentenceBefore") }}:</strong>
                      {{ change.sentenceBefore }}
                    </p>
                    <p class="report-example__sentence">
                      <strong>{{ t("tools.booksGreekEditor.reportSentenceAfter") }}:</strong>
                      {{ change.sentenceAfter }}
                    </p>
                  </div>
                </article>
              </div>
            </details>
          </div>
        </div>

        <pre v-if="!reportData && reportText" class="books-result-panel__pre">{{ reportText }}</pre>
      </div>

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

<style scoped>
/*
  The layout groups input modes, rule metadata, and text results without
  introducing a separate page, which keeps the Books flow compact and readable.
*/
.books-editor-card {
  display: grid;
  gap: 1.25rem;
}

.mode-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.mode-toggle__option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.books-editor-card__textarea {
  width: 100%;
  min-height: 12rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 0.85rem;
  font: inherit;
  resize: vertical;
  background: #fff;
}

.rule-section {
  display: block;
}

.rule-section__details {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.55);
  overflow: hidden;
}

.rule-section__summary {
  cursor: pointer;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.rule-section__summary::-webkit-details-marker {
  display: none;
}

.rule-section__summary-copy {
  display: grid;
  gap: 0.2rem;
}

.rule-section__chevron {
  font-size: 1rem;
  color: rgba(15, 23, 42, 0.62);
  transition: transform 0.18s ease;
}

.rule-section__details[open] .rule-section__chevron,
.report-group[open] .rule-section__chevron {
  transform: rotate(180deg);
}

.rule-section__title {
  margin: 0;
  font-size: 1rem;
}

.rule-section__description {
  margin: 0;
  color: rgba(15, 23, 42, 0.72);
}

.rule-checkboxes {
  display: grid;
  gap: 0.75rem;
  max-height: 28rem;
  padding: 0 1rem 1rem;
  overflow: auto;
}

.rule-checkbox {
  display: grid;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 0.95rem;
  background: rgba(248, 250, 252, 0.8);
}

.rule-checkbox__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.rule-checkbox__copy {
  display: grid;
  gap: 0.2rem;
}

.rule-checkbox__title {
  display: block;
  font-weight: 600;
}

.rule-checkbox__description,
.rule-checkbox__details-line,
.checkbox-row__description {
  display: block;
  color: rgba(15, 23, 42, 0.72);
}

.rule-checkbox__preference {
  display: grid;
  gap: 0.35rem;
  padding-left: 1.65rem;
}

.rule-checkbox__preference-label {
  font-size: 0.94rem;
  font-weight: 600;
}

.rule-checkbox__select {
  width: min(100%, 18rem);
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.18);
  border-radius: 0.75rem;
  background: #fff;
  font: inherit;
}

.rule-checkbox__details {
  padding-left: 1.65rem;
}

.rule-checkbox__details summary {
  cursor: pointer;
  font-weight: 600;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.books-result-panel {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.85);
}

.books-result-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.books-result-panel__title {
  margin: 0;
  font-size: 1rem;
}

.books-result-panel__pre {
  margin: 0;
  padding: 0.85rem 0.95rem;
  border-radius: 0.85rem;
  background: rgba(15, 23, 42, 0.04);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.report-summary {
  display: grid;
  gap: 1rem;
}

.report-summary__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.report-stat,
.report-group {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  background: rgba(15, 23, 42, 0.04);
}

.report-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  cursor: pointer;
  list-style: none;
}

.report-group__header::-webkit-details-marker {
  display: none;
}

.report-group__header > span:first-child {
  display: grid;
  gap: 0.15rem;
}

.report-group__count {
  color: rgba(15, 23, 42, 0.65);
}

.report-groups {
  display: grid;
  gap: 0.75rem;
}

.report-group__examples {
  display: grid;
  gap: 0.65rem;
  max-height: 20rem;
  overflow: auto;
  margin-top: 0.75rem;
  padding-right: 0.2rem;
}

.report-example {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.72);
}

.report-example__tokens {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.report-example__sentences {
  display: grid;
  gap: 0.35rem;
}

.report-example__sentence {
  margin: 0;
  color: rgba(15, 23, 42, 0.78);
}

.report-example__before,
.report-example__after {
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: #fff;
}

.report-example__arrow {
  color: rgba(15, 23, 42, 0.56);
}
</style>
