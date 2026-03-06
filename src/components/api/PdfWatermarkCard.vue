<script setup>
/*
  Watermark UI keeps the first release practical by exposing text/image modes
  with minimal controls while preserving the same upload-to-download pattern.
*/
import { computed, ref } from "vue";
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
    error.value = "Select one PDF file first.";
    return;
  }

  if (mode.value === "image" && !watermarkImage.value) {
    error.value = "Select a watermark image when image mode is enabled.";
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
    error.value = runError instanceof Error ? runError.message : "Watermark request failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF watermark">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">PDF Watermark</h2>
      <p class="section-head__subtitle">Apply text or image watermark overlays on a PDF.</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Source PDF</p>
        <input type="file" accept="application/pdf" @change="onSourceFileSelected" />
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Watermark mode</p>
        <select v-model="mode" class="rotation-select">
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
      </div>

      <div v-if="mode === 'text'" class="merge-step">
        <label>
          Watermark text
          <input v-model="text" type="text" class="rotation-select" placeholder="CONFIDENTIAL" />
        </label>
      </div>

      <div v-else class="merge-step">
        <p class="merge-step__title">Watermark image</p>
        <input type="file" accept="image/*" @change="onWatermarkImageSelected" />
      </div>

      <div class="merge-step advanced-grid">
        <label>
          Opacity (0.05 - 1)
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
          Position
          <select v-model="position" class="rotation-select">
            <option value="center">Center</option>
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="top-center">Top center</option>
            <option value="bottom-center">Bottom center</option>
          </select>
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? "Applying..." : "Apply watermark" }}
        </button>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="outputUrl" class="tool-card__description">
        Ready:
        <a :href="outputUrl" :download="outputName">Download {{ outputName }}</a>
      </p>
    </article>
  </section>
</template>
