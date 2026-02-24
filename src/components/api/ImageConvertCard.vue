<script setup>
// Why this exists: image conversion now supports UX-first transparent-background workflows with automatic/picker detection, single-image guardrails, and before/after previews.
import { computed, ref } from "vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { useImageConversion } from "../../composables/useImageConversion";

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
  targetFormat,
  conversionOptions,
  loading,
  error,
  message,
  requestId,
  archiveUrl,
  archiveName,
  originalPreviewUrl,
  formattedPreviewUrl,
  formattedPreviewName,
  progressPercent,
  progressLabel,
  selectFiles,
  setBackgroundSeed,
  clearBackgroundSeeds,
  convert,
} = useImageConversion();

const supportsTransparency = computed(() =>
  ["png", "webp", "avif", "tiff", "gif"].includes(targetFormat.value)
);

const isPickerMode = computed(
  () =>
    conversionOptions.value.transparentBackground &&
    conversionOptions.value.backgroundDetectionMode === "picker"
);

const pickerPoints = computed(() => conversionOptions.value.pickerPoints || []);

const singleFileTransparentRuleSatisfied = computed(
  () => !conversionOptions.value.transparentBackground || files.value.length === 1
);

const canConvert = computed(
  () =>
    props.apiHealthy &&
    files.value.length > 0 &&
    !loading.value &&
    singleFileTransparentRuleSatisfied.value
);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};

const originalPreviewImageRef = ref(null);

const onOriginalPreviewClick = (event) => {
  if (!isPickerMode.value) {
    return;
  }

  const imageElement = originalPreviewImageRef.value;
  if (!imageElement) {
    return;
  }

  const rect = imageElement.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    return;
  }

  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  setBackgroundSeed({ x, y });
};
</script>

<template>
  <section aria-labelledby="image-convert-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="image-convert-endpoint" class="section-head__title">Image Convert Flow</h2>
      <p class="section-head__subtitle">
        Convert images to another format and optionally remove background.
      </p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Step 1: Select images</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/tiff"
          multiple
          @change="onFilesSelected"
        />
        <p class="tool-card__description">Selected files: {{ files.length }}</p>
        <p class="tool-card__description">
          Upload limits: max {{ MAX_UPLOAD_FILES }} files, {{ MAX_FILE_SIZE_MB }} MB each,
          {{ MAX_TOTAL_UPLOAD_MB }} MB total.
        </p>
        <p v-if="conversionOptions.transparentBackground" class="tool-card__description">
          Transparent background mode requires exactly one uploaded image.
        </p>
        <p
          v-if="conversionOptions.transparentBackground && !singleFileTransparentRuleSatisfied"
          class="tool-card__description tool-card__description--error"
        >
          Remove extra files to continue with transparent conversion.
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 2: Choose output format</p>
        <select v-model="targetFormat" class="rotation-select" :disabled="loading">
          <option value="jpeg">JPEG (.jpg)</option>
          <option value="png">PNG (.png)</option>
          <option value="webp">WEBP (.webp)</option>
          <option value="avif">AVIF (.avif)</option>
          <option value="tiff">TIFF (.tiff)</option>
          <option value="gif">GIF (.gif)</option>
        </select>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 3: File options</p>
        <div class="advanced-grid">
          <label>
            Quality (1-100, higher means better quality)
            <input
              v-model.number="conversionOptions.quality"
              type="number"
              min="1"
              max="100"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
          <label>
            Processing strength (0-9, higher may be slower)
            <input
              v-model.number="conversionOptions.effort"
              type="number"
              min="0"
              max="9"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
          <label class="advanced-checkbox">
            <input v-model="conversionOptions.lossless" type="checkbox" :disabled="loading" />
            Keep exact quality (WEBP/TIFF)
          </label>
          <label class="advanced-checkbox">
            <input
              v-model="conversionOptions.transparentBackground"
              type="checkbox"
              :disabled="loading || !supportsTransparency"
            />
            Remove background (make transparent)
          </label>
        </div>

        <div v-if="conversionOptions.transparentBackground" class="advanced-grid">
          <label>
            Background selection method
            <select
              v-model="conversionOptions.backgroundDetectionMode"
              class="rotation-select"
              :disabled="loading"
            >
              <option value="auto">Automatic (from image edges)</option>
              <option value="picker">Manual (click background in preview)</option>
            </select>
          </label>
          <label>
            Color similarity (0-255)
            <input
              v-model.number="conversionOptions.colorTolerance"
              type="number"
              min="0"
              max="255"
              class="rotation-select"
              :disabled="loading"
            />
          </label>
        </div>

        <p class="tool-card__description">
          Background removal works best when the background color is fairly even.
        </p>
        <p v-if="!supportsTransparency" class="tool-card__description">
          This format cannot keep transparency. Choose PNG/WEBP/AVIF/TIFF/GIF.
        </p>
      </div>

      <div v-if="originalPreviewUrl || formattedPreviewUrl" class="merge-step">
        <p class="merge-step__title">Step 4: Preview</p>
        <div class="image-preview-grid">
          <figure v-if="originalPreviewUrl" class="image-preview-card">
            <figcaption class="image-preview-card__label">Original</figcaption>
            <div
              class="image-preview-shell"
              :class="{ 'image-preview-shell--picker': isPickerMode }"
              @click="onOriginalPreviewClick"
            >
              <div class="image-preview-stage">
                <img
                  ref="originalPreviewImageRef"
                  class="image-preview-image"
                  :src="originalPreviewUrl"
                  alt="Original preview"
                />
                <span
                  v-for="(point, index) in isPickerMode ? pickerPoints : []"
                  :key="`${point.x}-${point.y}-${index}`"
                  class="image-picker-dot"
                  :style="{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }"
                />
              </div>
            </div>
            <p v-if="isPickerMode" class="tool-card__description">
              Click a few background spots so we can remove the right color.
            </p>
            <p v-if="isPickerMode && pickerPoints.length > 0" class="tool-card__description">
              Selected points: {{ pickerPoints.length }}
              <button
                type="button"
                class="button"
                :disabled="loading"
                @click="clearBackgroundSeeds"
              >
                Clear points
              </button>
            </p>
          </figure>

          <figure v-if="formattedPreviewUrl" class="image-preview-card">
            <figcaption class="image-preview-card__label">Converted preview</figcaption>
            <div class="image-preview-shell image-preview-shell--checker">
              <div class="image-preview-stage">
                <img
                  class="image-preview-image"
                  :src="formattedPreviewUrl"
                  alt="Converted preview"
                />
              </div>
            </div>
            <p v-if="formattedPreviewName" class="tool-card__description">
              {{ formattedPreviewName }}
            </p>
          </figure>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 5: Create converted files</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canConvert"
          @click="convert(props.apiBaseUrl)"
        >
          {{ loading ? "Creating..." : "Create Converted Files" }}
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
        Your converted files are ready.
        <a :href="archiveUrl" :download="archiveName">Download {{ archiveName }}</a>
      </p>
    </div>
  </section>
</template>
