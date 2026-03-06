<script setup>
/*
  Shared JSON workspace now uses the portal translation store so generic
  controls, placeholders, and output actions can switch languages centrally.
*/
import { computed } from "vue";
import JsonDiffViewer from "./JsonDiffViewer.vue";
import JsonOutputDownloadBar from "./JsonOutputDownloadBar.vue";
import { usePortalI18n } from "../../i18n";
import { useJsonToolRunner } from "../../composables/useJsonToolRunner";

const props = defineProps({
  tool: {
    type: Object,
    required: true,
  },
});
const toolRef = computed(() => props.tool);
const { t } = usePortalI18n();

const {
  primaryInput,
  secondaryInput,
  options,
  outputText,
  outputUrl,
  loading,
  autoRun,
  error,
  message,
  downloadFileName,
  runTool,
  copyOutput,
  onPrimaryFileSelected,
  onSecondaryFileSelected,
  resetOptions,
  swapInputs,
  clearAll,
} = useJsonToolRunner(toolRef);

const hasSecondaryInput = computed(() => Boolean(toolRef.value.secondaryInputMode));

const onFileUpload = async (event, target = "primary") => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (target === "secondary") {
    await onSecondaryFileSelected(file);
  } else {
    await onPrimaryFileSelected(file);
  }

  event.target.value = "";
};

const onCopy = async () => {
  await copyOutput();
};
</script>

<template>
  <section class="tool-card json-workspace" aria-label="JSON tool workspace">
    <div class="section-head">
      <h3 class="section-head__title">{{ tool.title }}</h3>
      <p class="section-head__subtitle">{{ tool.description }}</p>
    </div>

    <div class="json-workspace__controls">
      <label class="advanced-checkbox">
        <input v-model="autoRun" type="checkbox" />
        {{ t("json.workspace.autoRun") }}
      </label>
      <button type="button" class="button button--secondary" @click="resetOptions">
        {{ t("json.workspace.resetOptions") }}
      </button>
      <button
        v-if="hasSecondaryInput"
        type="button"
        class="button button--secondary"
        @click="swapInputs"
      >
        {{ t("json.workspace.swapInputs") }}
      </button>
      <button
        type="button"
        class="button button--primary"
        :disabled="loading"
        @click="runTool({ force: true })"
      >
        {{ loading ? t("json.workspace.running") : t("json.workspace.runTool") }}
      </button>
    </div>

    <div class="json-workspace__grid">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("json.workspace.primaryInput") }}</p>
        <textarea
          v-model="primaryInput"
          class="json-textarea"
          rows="14"
          :placeholder="tool.inputLabel || t('json.workspace.inputPlaceholder')"
        />
        <input
          type="file"
          accept=".json,.txt,.csv,.xml,.yaml,.yml,.sql"
          @change="onFileUpload($event, 'primary')"
        />
      </div>

      <div v-if="hasSecondaryInput" class="merge-step">
        <p class="merge-step__title">{{ t("json.workspace.secondaryInput") }}</p>
        <textarea
          v-model="secondaryInput"
          class="json-textarea"
          rows="14"
          :placeholder="tool.secondaryInputLabel || t('json.workspace.secondaryInputPlaceholder')"
        />
        <input
          type="file"
          accept=".json,.txt,.csv,.xml,.yaml,.yml,.sql"
          @change="onFileUpload($event, 'secondary')"
        />
      </div>
    </div>

    <div v-if="tool.optionsSchema.length > 0" class="merge-step">
      <p class="merge-step__title">{{ t("json.workspace.options") }}</p>
      <div class="advanced-grid">
        <label v-for="field in tool.optionsSchema" :key="field.key">
          {{ field.label }}
          <input
            v-if="field.type === 'text'"
            v-model="options[field.key]"
            type="text"
            class="rotation-select"
          />
          <input
            v-else-if="field.type === 'number'"
            v-model.number="options[field.key]"
            type="number"
            class="rotation-select"
            :min="field.min"
            :max="field.max"
          />
          <select
            v-else-if="field.type === 'select'"
            v-model="options[field.key]"
            class="rotation-select"
          >
            <option v-for="item in field.options || []" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <span v-else-if="field.type === 'checkbox'" class="advanced-checkbox">
            <input v-model="options[field.key]" type="checkbox" />
            {{ t("json.workspace.enabled") }}
          </span>
        </label>
      </div>
    </div>

    <div v-if="hasSecondaryInput" class="merge-step">
      <p class="merge-step__title">{{ t("json.workspace.inputComparison") }}</p>
      <JsonDiffViewer :primary-input="primaryInput" :secondary-input="secondaryInput" />
    </div>

    <div class="merge-step">
      <p class="merge-step__title">{{ t("json.workspace.output") }}</p>
      <p v-if="error" class="tool-card__description tool-card__description--error">
        <strong>{{ error.code }}</strong
        >: {{ error.message }}
      </p>
      <p v-if="message && !error" class="tool-card__description">{{ message }}</p>

      <img
        v-if="tool.outputKind === 'visual' && outputUrl"
        :src="outputUrl"
        :alt="t('json.workspace.generatedVisualAlt')"
        class="json-visual-output"
      />
      <textarea v-else v-model="outputText" class="json-textarea" rows="14" readonly />

      <JsonOutputDownloadBar
        :disabled="loading || (!outputText && !outputUrl)"
        :output-url="outputUrl"
        :download-file-name="downloadFileName"
        @copy="onCopy"
        @clear="clearAll"
      />
    </div>
  </section>
</template>
