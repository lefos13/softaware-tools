<script setup lang="ts">
/*
  The books editor now follows the portal-wide access plan so free usage and
  shared paid-token sessions unlock the same workspace without a local token gate.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { BOOKS_GREEK_EDITOR_PREFERENCES } from "../../config/booksGreekEditorRules";
import { useGreekLiteratureEditor } from "../../composables/useGreekLiteratureEditor";
import { usePortalI18n } from "../../i18n";
import type { PortalAccessStore, PortalI18n } from "../../types/shared";
import { portalAccessKey } from "../../types/shared";
import type { GreekEditorReportChange, ServiceFlowShellContext } from "../../types/services";

interface BooksRuleViewModel {
  id: string;
  title: string;
  description: string;
  example: string;
  cases: string;
  preferenceKey?: string;
  preferenceLabel: string;
  preferenceOptions: Array<{ value: string; label: string }>;
}

interface BooksSectionViewModel {
  id: string;
  open: boolean;
  title: string;
  description: string;
  rules: BooksRuleViewModel[];
}

interface ReportGroup {
  ruleId: string;
  title: string;
  count: number;
  changes: GreekEditorReportChange[];
}

const SECTION_IDS = ["literary", "orthography", "preferences"] as const;

const props = defineProps<{
  apiBaseUrl: string;
  apiHealthy: boolean;
}>();

const portalAccess = inject(portalAccessKey) as PortalAccessStore | undefined;
const serviceFlowShell = inject<ServiceFlowShellContext | null>("serviceFlowShell", null);
const { t } = usePortalI18n() as PortalI18n;
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
  estimatedWordCount,
  estimatedWordCountLoading,
  estimatedWordCountError,
  rulesBySection,
  hasInput,
  hasSelectedRules,
  hasTextResult,
  setInputMode,
  setServiceToken,
  clearServiceToken,
  selectFiles,
  setInputText,
  toggleRule,
  setAllRules,
  setPreference,
  setIncludeReport,
  clearExecution,
  applyEditor,
} = useGreekLiteratureEditor();

const showSuccessModal = ref(false);
const hasDownloadResult = computed(() => Boolean(resultUrl.value || resultTextUrl.value));
const hasAnyResult = computed(
  () => hasDownloadResult.value || Boolean(reportData.value || reportText.value)
);
const canApply = computed(
  () =>
    props.apiHealthy &&
    portalAccess?.initialized?.value === true &&
    hasInput.value &&
    hasSelectedRules.value &&
    !loading.value
);

const sectionItems = computed<BooksSectionViewModel[]>(() =>
  SECTION_IDS.map((sectionId) => ({
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

const reportGroups = computed<ReportGroup[]>(() => {
  const report = reportData?.value;
  if (!report || !Array.isArray(report.changes) || report.changes.length === 0) {
    return [];
  }

  const grouped = new Map<string, ReportGroup>();
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
    if (!entry) {
      return;
    }
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
  showSuccessModal.value = Boolean(nextUrl && nextUrl !== prevUrl);
});

watch(
  () => loading.value,
  (nextValue) => {
    serviceFlowShell?.setLoading(nextValue);
  },
  { immediate: true }
);

watch(
  () => hasAnyResult.value,
  (nextValue) => {
    serviceFlowShell?.setHasResult(nextValue);
  },
  { immediate: true }
);

/*
  The editor service token is inherited from the shared portal access store so
  the books flow stays aligned with the client-wide free-versus-paid session.
*/
watch(
  () => [portalAccess?.activeToken?.value, portalAccess?.plan?.value?.token],
  () => {
    const nextToken = portalAccess?.activeToken?.value || "";
    if (nextToken) {
      setServiceToken(nextToken);
      return;
    }

    clearServiceToken();
  },
  { immediate: true }
);

const onFilesSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  selectFiles(Array.from(input?.files || []));
};
const onSelectAllRulesChange = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  setAllRules(input?.checked === true);
};
const onPreferenceChange = (preferenceKey: string, event: Event): void => {
  const input = event.target as HTMLSelectElement | null;
  setPreference(preferenceKey, input?.value || "");
};
const onIncludeReportChange = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  setIncludeReport(input?.checked === true);
};
const onInputModeChange = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  setInputMode(input?.value || "docx");
};
const onTextInput = (event: Event): void => {
  const input = event.target as HTMLTextAreaElement | null;
  setInputText(input?.value || "");
};
const closeSuccessModal = (): void => {
  showSuccessModal.value = false;
};
const clearCompletedExecution = (): void => {
  showSuccessModal.value = false;
  clearExecution();
};

/*
  The editor flow keeps the file picker visible, but omits the shared upload
  limits copy because this tool only accepts one DOCX document at a time.
*/
/*
  The result modal already confirms completion and exposes downloads, so this
  view no longer renders duplicate completion/status text or request metadata.
*/
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
      <div v-if="!hasAnyResult" class="books-panel">
        <p class="merge-step__title">
          {{ t("tools.booksGreekEditor.ui.step2Title") }}
        </p>

        <div class="panel-card">
          <p class="panel-card__title">{{ t("tools.booksGreekEditor.ui.chooseInput") }}</p>
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
            <p v-if="estimatedWordCountLoading" class="tool-card__description">
              {{ t("tools.booksGreekEditor.ui.countingWordsDocx") }}
            </p>
            <p
              v-else-if="estimatedWordCountError"
              class="tool-card__description tool-card__description--error"
            >
              {{ estimatedWordCountError }}
            </p>
            <p v-else-if="file" class="tool-card__description">
              {{
                t("tools.booksGreekEditor.ui.estimatedWords", {
                  count: estimatedWordCount.toLocaleString(),
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
            <p class="tool-card__description">
              {{
                t("tools.booksGreekEditor.ui.estimatedWords", {
                  count: estimatedWordCount.toLocaleString(),
                })
              }}
            </p>
            <p class="tool-card__description">{{ t("tools.booksGreekEditor.textModeNote") }}</p>
          </template>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ t("tools.booksGreekEditor.ui.chooseRules") }}</p>
          <div class="panel-card__header">
            <p class="panel-card__subtitle">
              {{ t("tools.booksGreekEditor.ui.rulesSubtitle") }}
            </p>
          </div>
          <div class="rules-toolbar">
            <label class="checkbox-row checkbox-row--featured" for="books-select-all-rules">
              <input
                id="books-select-all-rules"
                type="checkbox"
                :checked="allRulesSelected"
                :disabled="loading"
                @change="onSelectAllRulesChange"
              />
              <span>
                <strong>{{ t("tools.booksGreekEditor.selectAllRules") }}</strong>
                <span class="checkbox-row__description">{{
                  t("tools.booksGreekEditor.selectAllRulesHelp")
                }}</span>
              </span>
            </label>
            <p class="selection-pill">
              {{ t("tools.booksGreekEditor.selectedRules", { count: selectedRuleIds.length }) }}
            </p>
          </div>

          <div v-for="section in sectionItems" :key="section.id" class="rule-section">
            <details class="rule-section__details" :open="section.open">
              <summary class="rule-section__summary">
                <span class="rule-section__summary-copy">
                  <span class="rule-section__title">{{ section.title }}</span>
                  <span class="rule-section__description">{{ section.description }}</span>
                </span>
                <span class="rule-section__summary-side">
                  <span class="rule-section__count">{{ section.rules.length }}</span>
                  <span class="rule-section__chevron" aria-hidden="true"></span>
                </span>
              </summary>

              <div class="rule-checkboxes">
                <label
                  v-for="rule in section.rules"
                  :key="rule.id"
                  class="rule-checkbox"
                  :for="`rule-${rule.id}`"
                >
                  <span class="rule-checkbox__layout">
                    <span class="rule-checkbox__control">
                      <input
                        :id="`rule-${rule.id}`"
                        :checked="selectedRuleIds.includes(rule.id)"
                        type="checkbox"
                        :disabled="loading"
                        @change="toggleRule(rule.id)"
                      />
                    </span>
                    <span class="rule-checkbox__body">
                      <span class="rule-checkbox__header">
                        <span class="rule-checkbox__copy">
                          <span class="rule-checkbox__title">{{ rule.title }}</span>
                          <span class="rule-checkbox__description">{{ rule.description }}</span>
                        </span>
                      </span>

                      <div v-if="rule.preferenceKey" class="rule-checkbox__preference">
                        <label
                          class="rule-checkbox__preference-label"
                          :for="`${rule.id}-preference`"
                        >
                          {{ rule.preferenceLabel }}
                        </label>
                        <select
                          :id="`${rule.id}-preference`"
                          class="rule-checkbox__select"
                          :value="preferences[rule.preferenceKey]"
                          :disabled="loading"
                          @change="onPreferenceChange(rule.preferenceKey, $event)"
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
                    </span>
                  </span>
                </label>
              </div>
            </details>
          </div>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ t("tools.booksGreekEditor.ui.outputOptions") }}</p>
          <label class="checkbox-row" for="books-include-report">
            <input
              id="books-include-report"
              type="checkbox"
              :checked="includeReport"
              :disabled="loading"
              @change="onIncludeReportChange"
            />
            <span>
              <strong>{{ t("tools.booksGreekEditor.includeReport") }}</strong>
              <span class="checkbox-row__description">{{
                t("tools.booksGreekEditor.includeReportHelp")
              }}</span>
            </span>
          </label>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ t("tools.booksGreekEditor.ui.runEditor") }}</p>
          <button
            type="button"
            class="button button--primary"
            :disabled="!canApply"
            @click="applyEditor(props.apiBaseUrl)"
          >
            {{ loading ? t("tools.booksGreekEditor.applying") : t("tools.booksGreekEditor.apply") }}
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
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>

      <div v-if="loading || hasAnyResult" class="books-panel">
        <div class="books-panel__head">
          <p class="merge-step__title">
            {{ t("tools.booksGreekEditor.ui.step3Title") }}
          </p>
          <button
            v-if="hasAnyResult && !loading"
            type="button"
            class="button button--secondary"
            @click="clearCompletedExecution"
          >
            {{ t("tools.booksGreekEditor.ui.clear") }}
          </button>
        </div>

        <div v-if="loading" class="books-result-panel books-result-panel--pending">
          <strong>{{ t("tools.booksGreekEditor.ui.processingDocument") }}</strong>
          <p class="tool-card__description">
            {{ t("tools.booksGreekEditor.ui.processingDescription") }}
          </p>
        </div>

        <div v-else-if="hasAnyResult" class="books-results-stack">
          <div v-if="hasDownloadResult" class="books-result-panel">
            <div class="books-result-panel__header">
              <h3 class="books-result-panel__title">
                {{ t("tools.booksGreekEditor.ui.downloadOutput") }}
              </h3>
              <div class="books-result-panel__actions">
                <a
                  v-if="resultUrl"
                  class="button button--secondary"
                  :href="resultUrl"
                  :download="resultName"
                >
                  {{ t("tools.booksGreekEditor.ui.downloadCorrectedDocx") }}
                </a>
                <a
                  v-if="resultTextUrl"
                  class="button button--secondary"
                  :href="resultTextUrl"
                  :download="resultTextName"
                >
                  {{ t("tools.booksGreekEditor.downloadCorrectedText") }}
                </a>
              </div>
            </div>
            <p class="tool-card__description">
              {{
                resultUrl
                  ? t("tools.booksGreekEditor.ui.downloadDocxReady")
                  : t("tools.booksGreekEditor.ui.downloadTextReady")
              }}
            </p>
            <p v-if="includeReport && resultUrl" class="tool-card__description">
              {{ t("tools.booksGreekEditor.ui.reportIncludedInZip") }}
            </p>
          </div>

          <div v-if="hasTextResult" class="books-result-panel">
            <div class="books-result-panel__header">
              <h3 class="books-result-panel__title">
                {{ t("tools.booksGreekEditor.textResultTitle") }}
              </h3>
            </div>
            <textarea class="books-editor-card__textarea" :value="resultText" rows="10" readonly />
          </div>

          <div
            v-if="reportData || reportText"
            class="books-result-panel books-result-panel__report"
          >
            <div class="books-result-panel__header">
              <h3 class="books-result-panel__title">
                {{ t("tools.booksGreekEditor.reportTitle") }}
              </h3>
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
                    <span class="report-group__summary-copy">
                      <strong>{{ group.title }}</strong>
                      <span class="report-group__count">
                        {{ t("tools.booksGreekEditor.reportOccurrences", { count: group.count }) }}
                      </span>
                    </span>
                    <span class="rule-section__chevron" aria-hidden="true"></span>
                  </summary>
                  <div class="report-group__examples">
                    <article
                      v-for="(change, index) in group.changes"
                      :key="`${group.ruleId}-${index}`"
                      class="report-example"
                    >
                      <div class="report-example__tokens">
                        <span class="report-example__before">{{ change.before }}</span>
                        <span class="report-example__arrow">&rarr;</span>
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

            <pre v-if="!reportData && reportText" class="books-result-panel__pre">{{
              reportText
            }}</pre>
          </div>
        </div>
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

<style src="./BooksGreekEditorCard.scss" lang="scss"></style>
