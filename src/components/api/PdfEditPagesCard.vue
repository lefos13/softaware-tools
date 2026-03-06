<script setup>
/*
  Edit-pages UI now uses guided form inputs and converts them to backend
  editPlan JSON internally so non-technical users can run page operations.
*/
import { computed, ref } from "vue";
import { editPdfPages } from "../../services/pdfService";

const props = defineProps({
  apiBaseUrl: { type: String, required: true },
  apiHealthy: { type: Boolean, required: true },
});

const file = ref(null);
const keepPagesInput = ref("");
const deletePagesInput = ref("");
const reorderPagesInput = ref("");
const rotateRows = ref([{ page: "", angle: 90 }]);
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

/*
  List parsing accepts comma-separated page numbers and ignores duplicates so
  inputs remain forgiving while still producing deterministic payloads.
*/
const parsePageList = (rawValue) => {
  const text = String(rawValue || "").trim();
  if (!text) {
    return [];
  }

  const seen = new Set();
  const out = [];

  text
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const page = Number.parseInt(token, 10);
      if (!Number.isInteger(page) || page < 1) {
        throw new Error(`Invalid page number: "${token}"`);
      }

      if (!seen.has(page)) {
        seen.add(page);
        out.push(page);
      }
    });

  return out;
};

const addRotateRow = () => {
  rotateRows.value.push({ page: "", angle: 90 });
};

const removeRotateRow = (index) => {
  rotateRows.value.splice(index, 1);
  if (rotateRows.value.length === 0) {
    rotateRows.value.push({ page: "", angle: 90 });
  }
};

const buildRotatePayload = () => {
  const allowedAngles = new Set([0, 90, 180, 270]);
  const out = [];

  rotateRows.value.forEach((row, index) => {
    const pageText = String(row.page || "").trim();
    if (!pageText) {
      return;
    }

    const page = Number.parseInt(pageText, 10);
    const angle = Number.parseInt(String(row.angle), 10);
    if (!Number.isInteger(page) || page < 1) {
      throw new Error(`Rotate row ${index + 1}: page must be a positive integer`);
    }

    if (!allowedAngles.has(angle)) {
      throw new Error(`Rotate row ${index + 1}: angle must be one of 0, 90, 180, 270`);
    }

    out.push({ page, angle });
  });

  return out;
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

  let keep;
  let deletePages;
  let reorder;
  let rotate;
  try {
    keep = parsePageList(keepPagesInput.value);
    deletePages = parsePageList(deletePagesInput.value);
    reorder = parsePageList(reorderPagesInput.value);
    rotate = buildRotatePayload();
  } catch (parseError) {
    error.value = parseError instanceof Error ? parseError.message : "Invalid form values.";
    return;
  }

  const plan = {};
  if (keep.length > 0) {
    plan.keep = keep;
  }
  if (deletePages.length > 0) {
    plan.delete = deletePages;
  }
  if (reorder.length > 0) {
    plan.reorder = reorder;
  }
  if (rotate.length > 0) {
    plan.rotate = rotate;
  }

  loading.value = true;
  try {
    const result = await editPdfPages(props.apiBaseUrl, file.value, plan);
    outputUrl.value = URL.createObjectURL(result.blob);
    outputName.value = result.fileName;
    message.value = result.message;
    requestId.value = result.requestId;
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Edit pages request failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF edit pages">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">PDF Edit Pages</h2>
      <p class="section-head__subtitle">Rotate, reorder, delete, or keep selected pages.</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">Source PDF</p>
        <input type="file" accept="application/pdf" @change="onFileSelected" />
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Keep pages (optional)</p>
        <input
          v-model="keepPagesInput"
          type="text"
          class="rotation-select"
          placeholder="Example: 1,2,3,4"
        />
        <p class="tool-card__description">Leave blank to keep all pages before other operations.</p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Delete pages (optional)</p>
        <input
          v-model="deletePagesInput"
          type="text"
          class="rotation-select"
          placeholder="Example: 2,5"
        />
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Reorder pages (optional)</p>
        <input
          v-model="reorderPagesInput"
          type="text"
          class="rotation-select"
          placeholder="Example: 4,1,3"
        />
        <p class="tool-card__description">
          Provide only the pages you want first. Remaining selected pages keep their order.
        </p>
      </div>

      <div class="merge-step">
        <p class="merge-step__title">Rotate specific pages (optional)</p>
        <div class="rotate-grid">
          <div v-for="(row, index) in rotateRows" :key="index" class="rotate-grid__row">
            <input
              v-model="row.page"
              type="number"
              min="1"
              class="rotation-select"
              placeholder="Page"
            />
            <select v-model.number="row.angle" class="rotation-select">
              <option :value="0">0°</option>
              <option :value="90">90°</option>
              <option :value="180">180°</option>
              <option :value="270">270°</option>
            </select>
            <button type="button" class="button button--secondary" @click="removeRotateRow(index)">
              Remove
            </button>
          </div>
        </div>
        <button type="button" class="button button--secondary" @click="addRotateRow">
          Add rotate row
        </button>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? "Applying..." : "Apply page edits" }}
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
.rotate-grid {
  display: grid;
  gap: 0.55rem;
}

.rotate-grid__row {
  display: grid;
  grid-template-columns: 110px 130px auto;
  gap: 0.5rem;
  align-items: center;
}

@media (max-width: 640px) {
  .rotate-grid__row {
    grid-template-columns: 1fr;
  }
}
</style>
