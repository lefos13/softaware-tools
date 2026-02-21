<script setup>
// This component offers user-friendly compression presets plus advanced controls and downloads one ZIP for all processed images.
import { computed } from "vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { useImageCompression } from "../../composables/useImageCompression";

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
  files,
  mode,
  advancedOptions,
  loading,
  error,
  message,
  requestId,
  archiveUrl,
  archiveName,
  selectFiles,
  compress,
} = useImageCompression();

const canCompress = computed(() => props.apiHealthy && files.value.length > 0 && !loading.value);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};
</script>

<template>
  <section aria-labelledby="image-compress-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="image-compress-endpoint" class="section-head__title">Image Compression Flow</h2>
      <p class="section-head__subtitle">
        POST /api/image/compress (multipart/form-data, field: files[])
      </p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Step 1: Select images</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          @change="onFilesSelected"
        />
        <p class="tool-card__description">Selected files: {{ files.length }}</p>
        <p class="tool-card__description">
          Upload guard: max {{ MAX_UPLOAD_FILES }} files, {{ MAX_FILE_SIZE_MB }} MB each,
          {{ MAX_TOTAL_UPLOAD_MB }} MB total.
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 2: Choose compression mode</p>
        <select v-model="mode" class="rotation-select" :disabled="loading">
          <option value="light">Light (high quality)</option>
          <option value="balanced">Balanced</option>
          <option value="aggressive">Aggressive (smaller files)</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div v-if="mode === 'advanced'" class="merge-step">
        <p class="merge-step__title">Advanced options</p>
        <div class="advanced-grid">
          <label>
            Quality (1-100)
            <input
              v-model.number="advancedOptions.quality"
              type="number"
              min="1"
              max="100"
              class="rotation-select"
            />
          </label>
          <label>
            Format
            <select v-model="advancedOptions.format" class="rotation-select">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
              <option value="avif">AVIF</option>
            </select>
          </label>
          <label>
            Max width
            <input
              v-model.number="advancedOptions.maxWidth"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            Max height
            <input
              v-model.number="advancedOptions.maxHeight"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            Effort (0-9)
            <input
              v-model.number="advancedOptions.effort"
              type="number"
              min="0"
              max="9"
              class="rotation-select"
            />
          </label>
          <label class="advanced-checkbox">
            <input v-model="advancedOptions.lossless" type="checkbox" />
            Lossless (WEBP)
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 3: Compress</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canCompress"
          @click="compress(props.apiBaseUrl)"
        >
          {{ loading ? "Compressing..." : "Compress Images" }}
        </button>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="archiveUrl" class="tool-card__description">
        Compression complete.
        <a :href="archiveUrl" :download="archiveName">Download {{ archiveName }}</a>
      </p>
    </div>
  </section>
</template>
