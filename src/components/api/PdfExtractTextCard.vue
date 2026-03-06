<script setup>
/*
  Text extraction UI exposes merged TXT output by default with an explicit
  per-page ZIP option for workflows needing page-level separation.
*/
import { computed, ref } from "vue";
import { extractPdfText } from "../../services/pdfService";

const props = defineProps({
  apiBaseUrl: { type: String, required: true },
  apiHealthy: { type: Boolean, required: true },
});

const file = ref(null);
const perPageZip = ref(false);
const includePageHeaders = ref(true);
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
    const result = await extractPdfText(props.apiBaseUrl, file.value, {
      perPageZip: perPageZip.value,
      includePageHeaders: includePageHeaders.value,
    });
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Extract text request failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF extract text">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">PDF Extract Text</h2>
      <p class="section-head__subtitle">Export native PDF text to `.txt` or ZIP per page.</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Source PDF</p>
        <input type="file" accept="application/pdf" @change="onFileSelected" />
      </div>

      <div class="merge-step">
        <label class="checkbox-row">
          <input v-model="perPageZip" type="checkbox" />
          Return ZIP with one `.txt` per page
        </label>
        <label class="checkbox-row">
          <input v-model="includePageHeaders" type="checkbox" :disabled="perPageZip" />
          Include page headers in merged `.txt`
        </label>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? "Extracting..." : "Extract text" }}
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

<style scoped>
.checkbox-row {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}
</style>
