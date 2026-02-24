<script setup>
// This component now shows live progress and ETA during final compression so users can track completion and wait time.
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
  progressPercent,
  progressLabel,
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
        Reduce image file size while keeping good visual quality.
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
          Upload limits: max {{ MAX_UPLOAD_FILES }} files, {{ MAX_FILE_SIZE_MB }} MB each,
          {{ MAX_TOTAL_UPLOAD_MB }} MB total.
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 2: Choose quality mode</p>
        <select v-model="mode" class="rotation-select" :disabled="loading">
          <option value="light">High quality (larger files)</option>
          <option value="balanced">Balanced</option>
          <option value="aggressive">Smaller files (more compression)</option>
          <option value="advanced">Custom settings</option>
        </select>
      </div>

      <div v-if="mode === 'advanced'" class="merge-step">
        <p class="merge-step__title">Custom settings</p>
        <div class="advanced-grid">
          <label>
            Quality (1-100, higher means better quality)
            <input
              v-model.number="advancedOptions.quality"
              type="number"
              min="1"
              max="100"
              class="rotation-select"
            />
          </label>
          <label>
            Output format
            <select v-model="advancedOptions.format" class="rotation-select">
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
              <option value="avif">AVIF</option>
            </select>
          </label>
          <label>
            Max width (pixels)
            <input
              v-model.number="advancedOptions.maxWidth"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            Max height (pixels)
            <input
              v-model.number="advancedOptions.maxHeight"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            Processing strength (0-9, higher may be slower)
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
            Keep exact quality (available for WEBP)
          </label>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 3: Create compressed files</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canCompress"
          @click="compress(props.apiBaseUrl)"
        >
          {{ loading ? "Creating..." : "Create Compressed Files" }}
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

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="archiveUrl" class="tool-card__description">
        Your compressed files are ready.
        <a :href="archiveUrl" :download="archiveName">Download {{ archiveName }}</a>
      </p>
    </div>
  </section>
</template>
