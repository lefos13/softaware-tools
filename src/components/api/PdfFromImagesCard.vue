<script setup lang="ts">
/*
  Images-to-PDF UI follows the existing flow pattern with multi-file upload and
  direct download, covering a frequent admin/document assembly use case.
*/
import { computed, inject, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import { pdfFromImages } from "../../services/pdfService";
import type { PortalI18n } from "../../types/shared";
import type { ServiceFlowShellContext } from "../../types/services";

const props = defineProps<{
  apiBaseUrl: string;
  apiHealthy: boolean;
}>();
const { t } = usePortalI18n() as PortalI18n;
const serviceFlowShell = inject<ServiceFlowShellContext | null>("serviceFlowShell", null);

const files = ref<File[]>([]);
const loading = ref(false);
const error = ref("");
const message = ref("");
const requestId = ref("");
const outputUrl = ref("");
const outputName = ref("");

/*
  Inline-result cards also publish execution state to the shell so the
  stepper can stay consistent with modal-based tools.
*/
watch(
  () => loading.value,
  (nextValue) => {
    serviceFlowShell?.setLoading(nextValue);
  },
  { immediate: true }
);

watch(
  () => Boolean(outputUrl.value),
  (nextValue) => {
    serviceFlowShell?.setHasResult(nextValue);
  },
  { immediate: true }
);

const canRun = computed(() => props.apiHealthy && files.value.length > 0 && !loading.value);

const onFilesSelected = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  files.value = Array.from(input?.files || []);
  error.value = "";
};

const clearPreviousResult = (): void => {
  if (outputUrl.value) {
    URL.revokeObjectURL(outputUrl.value);
  }

  outputUrl.value = "";
  outputName.value = "";
  message.value = "";
  requestId.value = "";
};

const run = async (): Promise<void> => {
  clearPreviousResult();
  error.value = "";

  if (files.value.length === 0) {
    error.value = t("tools.errors.selectImagesFirst");
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
    error.value =
      runError instanceof Error ? runError.message : t("tools.errors.imagesToPdfFailed");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section aria-label="PDF from images">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("tools.pdfFromImages.title") }}</h2>
      <p class="section-head__subtitle">{{ t("tools.pdfFromImages.subtitle") }}</p>
    </div>

    <article class="tool-card">
      <div class="merge-step">
        <p class="merge-step__title">{{ t("tools.pdfFromImages.sourceImages") }}</p>
        <input type="file" accept="image/*" multiple @change="onFilesSelected" />
        <p class="tool-card__description">
          {{ t("tools.pdfFromImages.selectedImages", { count: files.length }) }}
        </p>
      </div>

      <div class="merge-step">
        <button type="button" class="button button--primary" :disabled="!canRun" @click="run">
          {{ loading ? t("tools.pdfFromImages.generating") : t("tools.pdfFromImages.generate") }}
        </button>
      </div>

      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        {{ t("tools.common.requestReference") }}: <code>{{ requestId }}</code>
      </p>
      <p v-if="outputUrl" class="tool-card__description">
        {{ t("app.readyPrefix") }}:
        <a :href="outputUrl" :download="outputName">{{
          t("tools.common.download", { name: outputName })
        }}</a>
      </p>
    </article>
  </section>
</template>
