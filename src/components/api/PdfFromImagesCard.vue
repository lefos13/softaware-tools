<script setup>
/*
  Images-to-PDF UI follows the existing flow pattern with multi-file upload and
  direct download, covering a frequent admin/document assembly use case.
*/
import { computed, ref } from "vue";
import { pdfFromImages } from "../../services/pdfService";

const props = defineProps({
  apiBaseUrl: { type: String, required: true },
  apiHealthy: { type: Boolean, required: true },
});

const files = ref([]);
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

const canRun = computed(() => props.apiHealthy && files.value.length > 0 && !loading.value);

const onFilesSelected = (event) => {
  files.value = Array.from(event.target.files || []);
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

  if (files.value.length === 0) {
    error.value = "Select one or more images first.";
    return;
  }

  loading.value = true;
  try {
    const result = await pdfFromImages(props.apiBaseUrl, files.value);
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Images to PDF request failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF from images">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">Images to PDF</h2>
      <p class="section-head__subtitle">Convert one or more images into a single PDF document.</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Source images</p>
        <input type="file" accept="image/*" multiple @change="onFilesSelected" />
        <p class="tool-card__description">Selected images: {{ files.length }}</p>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? "Generating..." : "Generate PDF" }}
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
