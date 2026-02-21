<script setup>
// App now provides a landing launcher and routes users to dedicated PDF/Image flows while keeping API health guard centralized.
import { computed, ref } from "vue";
import ToolCard from "./components/ToolCard.vue";
import ApiBaseUrlField from "./components/api/ApiBaseUrlField.vue";
import HealthCheckCard from "./components/api/HealthCheckCard.vue";
import ImageCompressionCard from "./components/api/ImageCompressionCard.vue";
import OpenApiSummary from "./components/api/OpenApiSummary.vue";
import PdfMergeCard from "./components/api/PdfMergeCard.vue";
import { useHealthCheck } from "./composables/useHealthCheck";

const apiBaseUrl = ref(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000");
const activeFlow = ref("home");

const { checking, hasChecked, isHealthy, status, message, requestId, error, lastCheckedAt } =
  useHealthCheck(apiBaseUrl);

const showGuardOverlay = computed(() => hasChecked.value && !isHealthy.value);
const flowTitle = computed(() => {
  if (activeFlow.value === "pdf") {
    return "PDF Merge";
  }

  if (activeFlow.value === "image") {
    return "Image Compression";
  }

  return "Service Launcher";
});
</script>

<template>
  <div class="portal-page">
    <header class="hero">
      <p class="hero__badge">Softaware Tools API Client</p>
      <h1 class="hero__title">{{ flowTitle }}</h1>
      <p class="hero__subtitle">
        Select a tool flow from the launcher, then complete the dedicated service steps with
        automatic API health protection.
      </p>
      <ApiBaseUrlField v-model="apiBaseUrl" />
    </header>

    <main class="tools-layout">
      <div>
        <HealthCheckCard
          :checking="checking"
          :is-healthy="isHealthy"
          :status="status"
          :message="message"
          :request-id="requestId"
          :error="error"
          :last-checked-at="lastCheckedAt"
        />

        <section v-if="activeFlow === 'home'" class="launcher-grid" aria-label="Tool launcher">
          <ToolCard
            title="PDF Merge"
            tag="PDF"
            description="Upload PDFs, preview order/rotation, then merge into one final document."
            action-label="Open PDF Flow"
            @action="activeFlow = 'pdf'"
          />
          <ToolCard
            title="Image Compression"
            tag="Image"
            description="Compress one or many images using presets or advanced compression controls."
            action-label="Open Image Flow"
            @action="activeFlow = 'image'"
          />
        </section>

        <section v-else class="flow-shell">
          <button type="button" class="button button--secondary" @click="activeFlow = 'home'">
            Back to Launcher
          </button>

          <PdfMergeCard
            v-if="activeFlow === 'pdf'"
            :api-base-url="apiBaseUrl"
            :api-healthy="isHealthy"
          />
          <ImageCompressionCard v-else :api-base-url="apiBaseUrl" :api-healthy="isHealthy" />
        </section>
      </div>

      <OpenApiSummary />
    </main>

    <div v-if="showGuardOverlay" class="guard-overlay" role="alert" aria-live="assertive">
      <div class="guard-overlay__card">
        <p class="guard-overlay__title">Server is down</p>
        <p class="guard-overlay__text">
          API guard blocked tool actions because <code>{{ apiBaseUrl }}</code> is not healthy.
        </p>
        <p class="guard-overlay__text">Update the API base URL or bring the backend back online.</p>
      </div>
    </div>
  </div>
</template>
