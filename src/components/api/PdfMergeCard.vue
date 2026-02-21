<script setup>
// This component now provides minimal arrow controls + drag-and-drop ordering, while clearly showing upload guards before merge.
import { computed } from "vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePdfMerge } from "../../composables/usePdfMerge";

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
  loading,
  error,
  message,
  requestId,
  fileUrl,
  fileName,
  draggingId,
  selectFiles,
  moveFile,
  startDragging,
  stopDragging,
  dropBefore,
  rotateFile,
  merge,
} = usePdfMerge();

const canMerge = computed(() => props.apiHealthy && files.value.length >= 2 && !loading.value);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};

const formatFileSize = (size) => {
  if (!size) {
    return "0 KB";
  }

  return `${(size / 1024).toFixed(1)} KB`;
};
</script>

<template>
  <section aria-labelledby="pdf-merge-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-merge-endpoint" class="section-head__title">PDF Merge Flow</h2>
      <p class="section-head__subtitle">
        1) select files, 2) drag/order, 3) set rotation, 4) merge (POST /api/pdf/merge)
      </p>
    </div>

    <div class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Step 1: Select PDFs</p>
        <input type="file" accept="application/pdf" multiple @change="onFilesSelected" />
        <p class="tool-card__description">Selected files: {{ files.length }}</p>
        <p class="tool-card__description">
          Upload guard: max {{ MAX_UPLOAD_FILES }} files, {{ MAX_FILE_SIZE_MB }} MB each,
          {{ MAX_TOTAL_UPLOAD_MB }} MB total.
        </p>
      </div>

      <div v-if="files.length" class="merge-step">
        <p class="merge-step__title">Step 2-3: Preview, order, and rotation</p>
        <div class="preview-grid">
          <article
            v-for="(entry, index) in files"
            :key="entry.id"
            class="preview-card"
            :class="{ 'preview-card--dragging': draggingId === entry.id }"
            draggable="true"
            @dragstart="startDragging(entry.id)"
            @dragend="stopDragging"
            @dragover.prevent
            @drop="dropBefore(entry.id)"
          >
            <div class="preview-card__head">
              <p class="preview-card__order">Order {{ index + 1 }}</p>
              <p class="preview-card__name" :title="entry.name">{{ entry.name }}</p>
              <p class="preview-card__meta">{{ formatFileSize(entry.size) }}</p>
            </div>

            <div class="pdf-preview-shell">
              <iframe
                :src="`${entry.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
                :title="`Preview ${entry.name}`"
                class="pdf-preview"
                :style="{ transform: `rotate(${entry.rotation}deg)` }"
              />
            </div>

            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--icon"
                :disabled="index === 0 || loading"
                aria-label="Move up"
                @click="moveFile(entry.id, 'up')"
              >
                ↑
              </button>
              <button
                type="button"
                class="button button--icon"
                :disabled="index === files.length - 1 || loading"
                aria-label="Move down"
                @click="moveFile(entry.id, 'down')"
              >
                ↓
              </button>
              <label>
                Rotation
                <select
                  class="rotation-select"
                  :disabled="loading"
                  :value="entry.rotation"
                  @change="rotateFile(entry.id, $event.target.value)"
                >
                  <option :value="0">0°</option>
                  <option :value="90">90°</option>
                  <option :value="180">180°</option>
                  <option :value="270">270°</option>
                </select>
              </label>
            </div>
          </article>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 4: Final merge</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canMerge"
          @click="merge(props.apiBaseUrl)"
        >
          {{ loading ? "Merging..." : "Merge PDFs" }}
        </button>
        <p v-if="!apiHealthy" class="tool-card__description tool-card__description--error">
          Merge disabled while API guard reports the server as unavailable.
        </p>
      </div>

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
