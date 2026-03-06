<script setup>
/*
  Numbering UI supports both standard page labels and Bates numbering with one
  concise form so legal/admin workflows can be tested quickly.
*/
import { computed, ref } from "vue";
import { addPdfPageNumbers } from "../../services/pdfService";

const props = defineProps({
  apiBaseUrl: { type: String, required: true },
  apiHealthy: { type: Boolean, required: true },
});

const file = ref(null);
const mode = ref("page_numbers");
const format = ref("Page {page} of {total}");
const prefix = ref("CASE-");
const startNumber = ref(1);
const padding = ref(6);
const position = ref("bottom-right");
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

const canRun = computed(() => props.apiHealthy && file.value && !loading.value);

const onFileSelected = (event) => {
  const [selected] = Array.from(event.target.files || []);
  file.value = selected || null;
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

  if (!file.value) {
    error.value = "Select one PDF file first.";
    return;
  }

  loading.value = true;
  try {
    const payload =
      mode.value === "bates"
        ? {
            mode: "bates",
            prefix: prefix.value,
            startNumber: Number(startNumber.value),
            padding: Number(padding.value),
            position: position.value,
          }
        : {
            mode: "page_numbers",
            format: format.value,
            position: position.value,
          };

    const result = await addPdfPageNumbers(props.apiBaseUrl, file.value, payload);
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Page numbering request failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF page numbers">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">PDF Page Numbers / Bates</h2>
      <p class="section-head__subtitle">Add standard page labels or Bates numbering.</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Source PDF</p>
        <input type="file" accept="application/pdf" @change="onFileSelected" />
      </div>

      <div class="merge-step">
        <label>
          Mode
          <select v-model="mode" class="rotation-select">
            <option value="page_numbers">Page numbers</option>
            <option value="bates">Bates numbering</option>
          </select>
        </label>
      </div>

      <div v-if="mode === 'page_numbers'" class="merge-step">
        <label>
          Format
          <input v-model="format" type="text" class="rotation-select" />
        </label>
        <p class="tool-card__description">Tokens: {page}, {total}</p>
      </div>

      <div v-else class="merge-step advanced-grid">
        <label>
          Prefix
          <input v-model="prefix" type="text" class="rotation-select" />
        </label>
        <label>
          Start number
          <input v-model.number="startNumber" type="number" min="1" class="rotation-select" />
        </label>
        <label>
          Padding
          <input v-model.number="padding" type="number" min="1" max="16" class="rotation-select" />
        </label>
      </div>

      <div class="merge-step">
        <label>
          Position
          <select v-model="position" class="rotation-select">
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-center">Bottom center</option>
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
            <option value="top-center">Top center</option>
          </select>
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? "Applying..." : "Apply numbering" }}
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
