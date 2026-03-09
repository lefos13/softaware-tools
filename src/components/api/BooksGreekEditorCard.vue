<script setup>
/*
  The books editor now follows the portal-wide access plan so free usage and
  shared paid-token sessions unlock the same workspace without a local token gate.
*/
import { computed, inject, ref, watch } from "vue";
import SuccessThankYouModal from "../SuccessThankYouModal.vue";
import { BOOKS_GREEK_EDITOR_PREFERENCES } from "../../config/booksGreekEditorRules";
import { useGreekLiteratureEditor } from "../../composables/useGreekLiteratureEditor";
import { usePortalI18n } from "../../i18n";

const props = defineProps({
  apiBaseUrl: { type: String, required: true },
  apiHealthy: { type: Boolean, required: true },
});

const portalAccess = inject("portalAccess");
const serviceFlowShell = inject("serviceFlowShell", null);
const { t, locale } = usePortalI18n();
const tr = (en, el) => (locale.value === "el" ? el : en);
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
const clearCompletedExecution = () => {
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
          {{
            tr(
              "Step 2 · Upload document and choose rules",
              "Βήμα 2 · Ανέβασμα εγγράφου και επιλογή κανόνων"
            )
          }}
        </p>

        <div class="panel-card">
          <p class="panel-card__title">{{ tr("Choose input", "Επιλογή εισόδου") }}</p>
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
              {{
                tr(
                  "Calculating billed word count from the uploaded DOCX...",
                  "Υπολογίζεται το χρεώσιμο πλήθος λέξεων από το DOCX..."
                )
              }}
            </p>
            <p
              v-else-if="estimatedWordCountError"
              class="tool-card__description tool-card__description--error"
            >
              {{ estimatedWordCountError }}
            </p>
            <p v-else-if="file" class="tool-card__description">
              {{
                tr(
                  `Estimated billed words: ${estimatedWordCount.toLocaleString()}`,
                  `Εκτιμώμενες χρεώσιμες λέξεις: ${estimatedWordCount.toLocaleString()}`
                )
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
                tr(
                  `Estimated billed words: ${estimatedWordCount.toLocaleString()}`,
                  `Εκτιμώμενες χρεώσιμες λέξεις: ${estimatedWordCount.toLocaleString()}`
                )
              }}
            </p>
            <p class="tool-card__description">{{ t("tools.booksGreekEditor.textModeNote") }}</p>
          </template>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ tr("Choose rules", "Επιλογή κανόνων") }}</p>
          <div class="panel-card__header">
            <p class="panel-card__subtitle">
              {{
                tr(
                  "Expand only the groups you need and keep the checklist easy to scan.",
                  "Expand only the groups you need and keep the checklist easy to scan."
                )
              }}
            </p>
          </div>
          <div class="rules-toolbar">
            <label class="checkbox-row checkbox-row--featured" for="books-select-all-rules">
              <input
                id="books-select-all-rules"
                type="checkbox"
                :checked="allRulesSelected"
                :disabled="loading"
                @change="setAllRules($event.target.checked)"
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
                    </span>
                  </span>
                </label>
              </div>
            </details>
          </div>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ tr("Output options", "Επιλογές εξόδου") }}</p>
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
              <span class="checkbox-row__description">{{
                t("tools.booksGreekEditor.includeReportHelp")
              }}</span>
            </span>
          </label>
        </div>

        <div class="panel-card">
          <p class="panel-card__title">{{ tr("Run editor", "Εκτέλεση editor") }}</p>
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
            {{
              tr(
                "Step 3 · Download link and report results",
                "Βήμα 3 · Σύνδεσμος λήψης και αποτελέσματα report"
              )
            }}
          </p>
          <button
            v-if="hasAnyResult && !loading"
            type="button"
            class="button button--secondary"
            @click="clearCompletedExecution"
          >
            {{ tr("Clear", "Καθαρισμός") }}
          </button>
        </div>

        <div v-if="loading" class="books-result-panel books-result-panel--pending">
          <strong>{{ tr("Processing document", "Γίνεται επεξεργασία εγγράφου") }}</strong>
          <p class="tool-card__description">
            {{
              tr(
                "The editor is running. The download link and report appear here when the request completes.",
                "Ο editor εκτελείται. Ο σύνδεσμος λήψης και το report θα εμφανιστούν εδώ όταν ολοκληρωθεί το αίτημα."
              )
            }}
          </p>
        </div>

        <div v-else-if="hasAnyResult" class="books-results-stack">
          <div v-if="hasDownloadResult" class="books-result-panel">
            <div class="books-result-panel__header">
              <h3 class="books-result-panel__title">
                {{ tr("Download output", "Λήψη αποτελέσματος") }}
              </h3>
              <div class="books-result-panel__actions">
                <a
                  v-if="resultUrl"
                  class="button button--secondary"
                  :href="resultUrl"
                  :download="resultName"
                >
                  {{ tr("Download corrected DOCX", "Λήψη διορθωμένου DOCX") }}
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
                  ? tr(
                      "The corrected DOCX is ready to download from the link above.",
                      "Το διορθωμένο DOCX είναι έτοιμο για λήψη από τον παραπάνω σύνδεσμο."
                    )
                  : tr(
                      "The corrected text is ready and can also be downloaded from the link above.",
                      "Το διορθωμένο κείμενο είναι έτοιμο και μπορεί επίσης να ληφθεί από τον παραπάνω σύνδεσμο."
                    )
              }}
            </p>
            <p v-if="includeReport && resultUrl" class="tool-card__description">
              {{
                tr(
                  "The detailed report is included inside the downloaded ZIP package to avoid consuming quota twice.",
                  "Το αναλυτικό report περιλαμβάνεται μέσα στο ZIP λήψης ώστε να μην καταναλώνεται το quota δύο φορές."
                )
              }}
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

<style scoped>
/*
  The editor uses the shared tool-card shell, so this stylesheet rebuilds the
  page as a bright, high-contrast workspace with stronger section hierarchy,
  stable checkbox alignment, and explicit scroll containers for dense content.
*/
.books-editor-card {
  --books-bg: linear-gradient(180deg, #f9fbfd 0%, #f2f6fa 100%);
  --books-surface: #ffffff;
  --books-surface-alt: #f6f9fc;
  --books-surface-strong: #eef6f5;
  --books-ink: #132235;
  --books-muted: #5e6f84;
  --books-border: #d5e0eb;
  --books-border-strong: #bccddd;
  --books-accent: #0f766e;
  --books-accent-soft: rgba(15, 118, 110, 0.1);
  --books-shadow: 0 18px 34px rgba(20, 33, 47, 0.08);

  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--books-border);
  border-radius: 18px;
  background: var(--books-bg);
  box-shadow: var(--books-shadow);
  color: var(--books-ink);
}

.books-editor-card,
.books-editor-card p,
.books-editor-card span,
.books-editor-card strong,
.books-editor-card summary,
.books-editor-card label,
.books-editor-card code {
  color: inherit;
}

.section-head--spaced {
  margin-top: 1rem;
  margin-bottom: 0.75rem;
}

.section-head__title {
  margin: 0;
  font-size: clamp(1.32rem, 2.2vw, 1.64rem);
  color: var(--ink);
}

.section-head__subtitle {
  margin: 0.3rem 0 0;
  max-width: 62rem;
  color: var(--ink-soft);
}

.books-panel,
.panel-card,
.books-result-panel {
  display: grid;
  gap: 0.85rem;
  padding: 0.95rem;
  border: 1px solid var(--books-border);
  border-radius: 14px;
  background: var(--books-surface);
}

.books-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 249, 252, 0.96));
  border-color: var(--books-border-strong);
}

.books-panel__head,
.books-result-panel__header,
.report-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.report-example__tokens {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.merge-step__title {
  margin: 0;
  font-size: 0.77rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--books-accent);
}

.panel-card__header {
  display: grid;
  gap: 0.25rem;
}

.panel-card__title,
.books-result-panel__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--books-ink);
}

.panel-card__subtitle,
.books-editor-card .tool-card__description,
.checkbox-row__description,
.rule-section__description,
.rule-checkbox__description,
.rule-checkbox__details-line,
.report-group__count,
.report-example__sentence {
  margin: 0;
  color: var(--books-muted);
  line-height: 1.5;
}

.mode-toggle {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.mode-toggle__option,
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-width: 0;
}

.mode-toggle__option {
  padding: 0.72rem 0.8rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: var(--books-surface-alt);
  color: var(--books-ink) !important;
}

.checkbox-row {
  padding: 0.72rem 0.8rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: var(--books-surface-alt);
  color: var(--books-ink) !important;
}

.checkbox-row--featured {
  background: linear-gradient(180deg, #fbfefe 0%, #f4faf9 100%);
}

.checkbox-row > span,
.rule-checkbox__copy,
.rule-section__summary-copy,
.report-group__summary-copy,
.report-example__sentences {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}

.books-editor-card input[type="text"],
.books-editor-card input[type="password"],
.books-editor-card input[type="file"],
.books-editor-card select,
.books-editor-card textarea {
  width: 100%;
  padding: 0.68rem 0.8rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--books-ink);
  font: inherit;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background-color 140ms ease;
}

.books-editor-card input[type="checkbox"],
.books-editor-card input[type="radio"] {
  accent-color: var(--books-accent);
}

.books-editor-card input:focus,
.books-editor-card select:focus,
.books-editor-card textarea:focus {
  outline: none;
  border-color: rgba(15, 118, 110, 0.48);
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}

.books-editor-card input::placeholder,
.books-editor-card textarea::placeholder {
  color: #8ea0b3;
}

.books-editor-card .button {
  border-radius: 12px;
}

.books-editor-card .button--primary {
  border-color: transparent;
  background: linear-gradient(180deg, #149589 0%, #0f766e 100%);
  box-shadow: 0 12px 22px rgba(15, 118, 110, 0.2);
}

.books-editor-card .button--secondary {
  border-color: var(--books-border);
  background: #ffffff;
  color: var(--books-ink);
}

.rules-toolbar {
  display: grid;
  gap: 0.75rem;
}

.selection-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin: 0;
  padding: 0.38rem 0.72rem;
  border: 1px solid rgba(15, 118, 110, 0.22);
  border-radius: 999px;
  background: var(--books-accent-soft);
  color: var(--books-accent);
  font-size: 0.88rem;
  font-weight: 800;
}

.rule-section {
  display: grid;
}

.rule-section__details,
.rule-checkbox,
.report-group,
.report-stat,
.report-example {
  border: 1px solid var(--books-border);
  background: #ffffff;
}

.rule-section__summary,
.report-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.9rem 1rem;
  cursor: pointer;
  list-style: none;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
}

.rule-section__summary::-webkit-details-marker,
.report-group__header::-webkit-details-marker {
  display: none;
}

.rule-section__summary-side {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  flex-shrink: 0;
}

.rule-section__title,
.rule-checkbox__title {
  font-weight: 800;
  color: var(--books-ink);
}

.rule-section__count {
  display: inline-flex;
  min-width: 2rem;
  justify-content: center;
  padding: 0.2rem 0.48rem;
  border-radius: 999px;
  background: #edf4fb;
  color: #4f647b;
  font-size: 0.78rem;
  font-weight: 800;
}

.rule-section__chevron {
  width: 0.62rem;
  height: 0.62rem;
  border-right: 2px solid #6d7f92;
  border-bottom: 2px solid #6d7f92;
  transform: rotate(45deg);
  transition: transform 140ms ease;
}

.rule-section__details[open] .rule-section__chevron,
.report-group[open] .rule-section__chevron {
  transform: rotate(225deg);
}

.rule-checkboxes {
  display: grid;
  gap: 0.8rem;
  max-height: 26rem;
  padding: 0.85rem;
  overflow: auto;
  border-top: 1px solid var(--books-border);
  background: #f9fbfd;
}

.rule-checkbox {
  padding: 0.85rem 0.9rem;
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(20, 33, 47, 0.04);
}

.rule-checkbox__layout {
  display: grid;
  grid-template-columns: 1.3rem minmax(0, 1fr);
  gap: 0.85rem;
  align-items: start;
}

.rule-checkbox__control {
  display: flex;
  justify-content: center;
  padding-top: 0.1rem;
}

.rule-checkbox__control input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  margin: 0;
}

.rule-checkbox__body {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.rule-checkbox__header {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.rule-checkbox__preference,
.rule-checkbox__details {
  display: grid;
  gap: 0.35rem;
}

.rule-checkbox__preference {
  padding: 0.7rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: #f8fbff;
}

.rule-checkbox__preference-label {
  color: var(--books-muted);
  font-size: 0.9rem;
  font-weight: 700;
}

.rule-checkbox__details {
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: #fbfdff;
}

.rule-checkbox__details summary {
  cursor: pointer;
  color: #51657c;
  font-weight: 700;
}

.books-editor-card__textarea {
  min-height: 12rem;
  resize: vertical;
}

.books-editor-card__textarea--result {
  background: #fbfdff;
}

.books-editor-card__inline-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.progress-panel {
  padding: 0.8rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: #f7fbfb;
}

.progress-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.progress-track {
  width: 100%;
  height: 0.55rem;
  margin-top: 0.55rem;
  border-radius: 999px;
  overflow: hidden;
  background: #d7e9e6;
}

.progress-track__bar {
  height: 100%;
  background: linear-gradient(90deg, #17a596 0%, #0f766e 100%);
  transition: width 160ms ease;
}

.books-result-panel__report,
.report-summary,
.report-groups,
.books-results-stack {
  display: grid;
  gap: 0.85rem;
}

.books-result-panel--empty,
.books-result-panel--pending {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 252, 0.95));
}

.books-result-panel__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.report-summary__stats {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.report-stat {
  display: grid;
  gap: 0.2rem;
  padding: 0.85rem 0.9rem;
  background: #f7fbff;
}

.report-stat strong {
  font-size: 1.2rem;
  font-weight: 800;
}

.report-group__summary-copy {
  align-items: start;
}

.report-group__examples {
  display: grid;
  gap: 0.7rem;
  max-height: 18rem;
  padding: 0 0.85rem 0.85rem;
  overflow: auto;
}

.report-example {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem 0.9rem;
  background: #f9fbfe;
}

.report-example__before,
.report-example__after {
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.5rem;
  border: 1px solid var(--books-border);
  border-radius: 999px;
  background: #ffffff;
}

.report-example__arrow {
  color: var(--books-muted);
  font-weight: 800;
}

.books-result-panel__pre {
  margin: 0;
  padding: 0.85rem 0.9rem;
  border: 1px solid var(--books-border);
  border-radius: 12px;
  background: #fbfdff;
  color: var(--books-ink);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.rule-checkboxes,
.report-group__examples,
.books-result-panel__pre,
.books-editor-card__textarea {
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 118, 110, 0.55) rgba(148, 163, 184, 0.18);
}

.rule-checkboxes::-webkit-scrollbar,
.report-group__examples::-webkit-scrollbar,
.books-result-panel__pre::-webkit-scrollbar,
.books-editor-card__textarea::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.rule-checkboxes::-webkit-scrollbar-track,
.report-group__examples::-webkit-scrollbar-track,
.books-result-panel__pre::-webkit-scrollbar-track,
.books-editor-card__textarea::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.18);
  border-radius: 999px;
}

.rule-checkboxes::-webkit-scrollbar-thumb,
.report-group__examples::-webkit-scrollbar-thumb,
.books-result-panel__pre::-webkit-scrollbar-thumb,
.books-editor-card__textarea::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #1ab3a3, #0f766e);
  border-radius: 999px;
}

.tool-card__description--error {
  color: #b91c1c !important;
}

@media (max-width: 760px) {
  .books-editor-card {
    padding: 0.8rem;
    border-radius: 14px;
  }

  .books-panel,
  .panel-card,
  .books-result-panel {
    padding: 0.8rem;
  }

  .books-panel__head,
  .books-result-panel__header,
  .report-group__header {
    align-items: stretch;
  }

  .books-panel__head > .button,
  .panel-card > .button,
  .books-result-panel__header > .button,
  .books-result-panel__header > a,
  .books-result-panel__actions > a {
    width: 100%;
  }

  .rule-section__summary,
  .report-group__header {
    padding: 0.8rem;
  }

  .rule-checkboxes {
    max-height: 20rem;
    padding: 0.7rem;
  }

  .rule-checkbox {
    padding: 0.75rem;
  }

  .rule-checkbox__layout {
    gap: 0.72rem;
  }
}
</style>
