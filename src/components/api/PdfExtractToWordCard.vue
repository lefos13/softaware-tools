<script setup>
// Why this exists: this guided card captures OCR extraction options and reuses the shared progress UX so users can convert mixed text/scanned PDFs directly to Word.
import { computed } from "vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePdfExtractToWord } from "../../composables/usePdfExtractToWord";

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

const {
  file,
  filePreviewUrl,
  includePageBreaks,
  includeOcrUsageNotes,
  languageMode,
  extractionQualityMode,
  loading,
  error,
  message,
  requestId,
  resultUrl,
  resultName,
  progressPercent,
  progressLabel,
  hasFile,
  selectFiles,
  extract,
} = usePdfExtractToWord();

const canExtract = computed(() => props.apiHealthy && hasFile.value && !loading.value);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};
</script>

<template>
  <section aria-labelledby="pdf-extract-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-extract-endpoint" class="section-head__title">PDF to Word Extraction Flow</h2>
      <p class="section-head__subtitle">
        Extract text from regular and scanned PDFs into a Word file.
      </p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Step 1: Select one PDF</p>
        <input type="file" accept="application/pdf" @change="onFilesSelected" />
        <p class="tool-card__description">Selected: {{ file ? file.name : "None" }}</p>
        <p class="tool-card__description">
          Upload limits: exactly 1 file, max {{ MAX_UPLOAD_FILES }} files allowed globally,
          {{ MAX_FILE_SIZE_MB }} MB each, {{ MAX_TOTAL_UPLOAD_MB }} MB total.
        </p>
      </div>

      <div v-if="filePreviewUrl" class="merge-step">
        <p class="merge-step__title">Source preview</p>
        <div class="pdf-preview-shell pdf-preview-shell--split">
          <iframe
            :src="`${filePreviewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
            title="Source PDF preview"
            class="pdf-preview"
          />
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 2: Text reading options</p>

        <label>
          Document language
          <select v-model="languageMode" class="rotation-select" :disabled="loading">
            <option value="en">English</option>
            <option value="gr">Greek</option>
            <option value="both">English + Greek</option>
          </select>
        </label>
        <p class="tool-card__description">
          Pick the language your PDF uses so scanned text is recognized more accurately.
        </p>

        <label>
          Reading quality
          <select v-model="extractionQualityMode" class="rotation-select" :disabled="loading">
            <option value="fast">Quick (fastest)</option>
            <option value="quality">Better accuracy</option>
            <option value="maximum">Maximum accuracy (slowest)</option>
            <option value="ultra">Best possible accuracy (slowest)</option>
          </select>
        </label>
        <p class="tool-card__description">
          For scanned or difficult PDFs, choose Maximum or Best possible accuracy for the strongest
          text detection.
        </p>

        <div class="advanced-grid">
          <label class="advanced-checkbox">
            <input v-model="includePageBreaks" type="checkbox" :disabled="loading" />
            Keep page breaks in the Word file
          </label>
          <label class="advanced-checkbox">
            <input v-model="includeOcrUsageNotes" type="checkbox" :disabled="loading" />
            Add a short note on pages where scanned-text reading was used
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 3: Create Word file</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canExtract"
          @click="extract(props.apiBaseUrl)"
        >
          {{ loading ? "Creating..." : "Create Word File" }}
        </button>
        <p v-if="!apiHealthy" class="tool-card__description tool-card__description--error">
          This action is unavailable while the server is offline.
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
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="resultUrl" class="tool-card__description">
        Your file is ready.
        <a :href="resultUrl" :download="resultName">Download {{ resultName }}</a>
      </p>
    </div>
  </section>
</template>
