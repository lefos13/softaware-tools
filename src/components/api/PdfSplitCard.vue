<script setup>
// Why this exists: PDF split is a dedicated, guided flow with multiple split modes and validations while reusing the same task progress UX as other long-running operations.
import { computed } from "vue";
import { MAX_FILE_SIZE_MB, MAX_TOTAL_UPLOAD_MB, MAX_UPLOAD_FILES } from "../../config/uploadLimits";
import { usePdfSplit } from "../../composables/usePdfSplit";

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
  mode,
  rangeOptions,
  selectedPagesInput,
  chunkSize,
  customGroups,
  loading,
  error,
  message,
  requestId,
  archiveUrl,
  archiveName,
  progressPercent,
  progressLabel,
  canRemoveCustomGroup,
  selectFiles,
  addCustomGroup,
  removeCustomGroup,
  split,
} = usePdfSplit();

const canSplit = computed(() => props.apiHealthy && Boolean(file.value) && !loading.value);

const onFilesSelected = (event) => {
  selectFiles(Array.from(event.target.files || []));
};
</script>

<template>
  <section aria-labelledby="pdf-split-endpoint">
    <div class="section-head section-head--spaced">
      <h2 id="pdf-split-endpoint" class="section-head__title">PDF Split Flow</h2>
      <p class="section-head__subtitle">Split one PDF into smaller files in the way you choose.</p>
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
        <p class="merge-step__title">Step 2: Choose split mode</p>
        <select v-model="mode" class="rotation-select" :disabled="loading">
          <option value="range">Page range (start to end)</option>
          <option value="selected_pages">Specific pages (single output file)</option>
          <option value="every_n_pages">Split every N pages</option>
          <option value="custom_groups">Named groups</option>
        </select>
      </div>

      <div v-if="mode === 'range'" class="merge-step">
        <p class="merge-step__title">Step 3: Page range options</p>
        <div class="advanced-grid">
          <label>
            Start page
            <input
              v-model.number="rangeOptions.fromPage"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
          <label>
            End page
            <input
              v-model.number="rangeOptions.toPage"
              type="number"
              min="1"
              class="rotation-select"
            />
          </label>
        </div>
      </div>

      <div v-else-if="mode === 'selected_pages'" class="merge-step">
        <p class="merge-step__title">Step 3: Specific pages</p>
        <label>
          Page numbers (comma-separated)
          <input
            v-model="selectedPagesInput"
            type="text"
            class="rotation-select"
            placeholder="1,5,10"
            :disabled="loading"
          />
        </label>
        <p class="tool-card__description">
          Example: 1,5,10. This creates one PDF that includes only those pages.
        </p>
      </div>

      <div v-else-if="mode === 'every_n_pages'" class="merge-step">
        <p class="merge-step__title">Step 3: Split size</p>
        <label>
          Pages per output file
          <input
            v-model.number="chunkSize"
            type="number"
            min="1"
            class="rotation-select"
            :disabled="loading"
          />
        </label>
      </div>

      <div v-else class="merge-step">
        <p class="merge-step__title">Step 3: Named groups</p>
        <div class="advanced-grid">
          <article v-for="group in customGroups" :key="group.id" class="preview-card">
            <div class="preview-card__head">
              <p class="preview-card__order">Group {{ group.id }}</p>
            </div>
            <div class="advanced-grid">
              <label>
                Group name (output file name hint)
                <input
                  v-model="group.name"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
              <label>
                Page ranges (comma-separated, e.g. 1-3,8-10)
                <input
                  v-model="group.rangesInput"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
              <label>
                Extra pages (comma-separated, e.g. 12,15)
                <input
                  v-model="group.pagesInput"
                  type="text"
                  class="rotation-select"
                  :disabled="loading"
                />
              </label>
            </div>
            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--secondary"
                :disabled="loading || !canRemoveCustomGroup"
                @click="removeCustomGroup(group.id)"
              >
                Remove group
              </button>
            </div>
          </article>
        </div>

        <div class="preview-card__actions">
          <button
            type="button"
            class="button button--secondary"
            :disabled="loading"
            @click="addCustomGroup"
          >
            Add group
          </button>
        </div>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Step 4: Create split files</p>
        <button
          type="button"
          class="button button--primary"
          :disabled="!canSplit"
          @click="split(props.apiBaseUrl)"
        >
          {{ loading ? "Creating..." : "Create Split Files" }}
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
        Your split files are ready.
        <a :href="archiveUrl" :download="archiveName">Download {{ archiveName }}</a>
      </p>
    </div>
  </section>
</template>
