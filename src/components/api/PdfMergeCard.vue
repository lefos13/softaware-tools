<script setup>
// This component now shows backend operation message and request reference after success, plus normalized error messages on failure.
import { usePdfMerge } from "../../composables/usePdfMerge";

const props = defineProps({
  apiBaseUrl: {
    type: String,
    required: true,
  },
});

const { files, loading, error, message, requestId, fileUrl, fileName, selectFiles, merge } =
  usePdfMerge();

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};
</script>

<template>
  <section aria-labelledby="pdf-merge-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-merge-endpoint" class="section-head__title">PDF Merge Endpoint</h2>
      <p class="section-head__subtitle">
        POST /api/pdf/merge (multipart/form-data, field: files[])
      </p>
    </div>

    <div class="tool-card">
      <input type="file" accept="application/pdf" multiple @change="onFilesSelected" />
      <p class="tool-card__description">Selected files: {{ files.length }}</p>
      <button
        type="button"
        class="button button--primary"
        :disabled="loading"
        @click="merge(props.apiBaseUrl)"
      >
        {{ loading ? "Merging..." : "Merge PDFs" }}
      </button>
      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="fileUrl" class="tool-card__description">
        Merge complete.
        <a :href="fileUrl" :download="fileName">Download {{ fileName }}</a>
      </p>
    </div>
  </section>
</template>
