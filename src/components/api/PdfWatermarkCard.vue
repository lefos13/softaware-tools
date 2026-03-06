<script setup>
/*
  Watermark UI keeps the first release practical by exposing text/image modes
  with minimal controls while preserving the same upload-to-download pattern.
*/
import { computed, ref } from "vue";
import { usePortalI18n } from "../../i18n";
import { watermarkPdf } from "../../services/pdfService";

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

const sourceFile = ref(null);
const watermarkImage = ref(null);
const mode = ref("text");
const text = ref("CONFIDENTIAL");
const opacity = ref(0.24);
const position = ref("center");
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

const canRun = computed(() => props.apiHealthy && sourceFile.value && !loading.value);

const onSourceFileSelected = (event) => {
  const [file] = Array.from(event.target.files || []);
  sourceFile.value = file || null;
  error.value = "";
};

const onWatermarkImageSelected = (event) => {
  const [file] = Array.from(event.target.files || []);
  watermarkImage.value = file || null;
  error.value = "";
};

const clearPreviousResult = () => {
  if (outputUrl.value) {
    URL.revokeObjectURL(outputUrl.value);
  }

  outputUrl.value = "";
  outputName.value = "";
  message.value = "";
  requestId.value = "";
};

const run = async () => {
  clearPreviousResult();
  error.value = "";

  if (!sourceFile.value) {
    error.value = t("tools.errors.selectPdfFirst");
    return;
  }

  if (mode.value === "image" && !watermarkImage.value) {
    error.value = t("tools.errors.selectWatermarkImage");
    return;
  }

  loading.value = true;

  try {
    const result = await watermarkPdf(
      props.apiBaseUrl,
      sourceFile.value,
      {
        mode: mode.value,
        text: text.value,
        opacity: Number(opacity.value),
        position: position.value,
      },
      watermarkImage.value
    );

    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : t("tools.errors.watermarkFailed");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF watermark">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("tools.pdfWatermark.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfWatermark.subtitle") }}</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfWatermark.sourcePdf") }}</p>
        <input type="file" accept="application/pdf" @change="onSourceFileSelected" />
      </div>

      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfWatermark.mode") }}</p>
        <select v-model="mode" class="rotation-select">
          <option value="text">{{ t("tools.pdfWatermark.text") }}</option>
          <option value="image">{{ t("tools.pdfWatermark.image") }}</option>
        </select>
      </div>

      <div v-if="mode === 'text'" class="merge-step">
        <label>
          {{ t("tools.pdfWatermark.watermarkText") }}
          <input v-model="text" type="text" class="rotation-select" placeholder="CONFIDENTIAL" />
        </label>
      </div>

      <div v-else class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfWatermark.watermarkImage") }}</p>
        <input type="file" accept="image/*" @change="onWatermarkImageSelected" />
      </div>

      <div class="merge-step advanced-grid">
        <label>
          {{ t("tools.pdfWatermark.opacity") }}
          <input
            v-model.number="opacity"
            type="number"
            min="0.05"
            max="1"
            step="0.01"
            class="rotation-select"
          />
        </label>
        <label>
          {{ t("tools.pdfWatermark.position") }}
          <select v-model="position" class="rotation-select">
            <option value="center">{{ t("tools.positions.center") }}</option>
            <option value="top-left">{{ t("tools.positions.top-left") }}</option>
            <option value="top-right">{{ t("tools.positions.top-right") }}</option>
            <option value="bottom-left">{{ t("tools.positions.bottom-left") }}</option>
            <option value="bottom-right">{{ t("tools.positions.bottom-right") }}</option>
            <option value="top-center">{{ t("tools.positions.top-center") }}</option>
            <option value="bottom-center">{{ t("tools.positions.bottom-center") }}</option>
          </select>
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? t("tools.pdfWatermark.applying") : t("tools.pdfWatermark.apply") }}
        </button>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        {{ t("tools.common.requestReference") }}: <code>{{ requestId }}</code>
      </p>
      <p v-if="outputUrl" class="tool-card__description">
        {{ t("app.readyPrefix") }}:
        <a :href="outputUrl" :download="outputName">{{
          t("tools.common.download", { name: outputName })
        }}</a>
      </p>
    </article>
  </section>
</template>
