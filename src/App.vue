<script setup>
// App-level orchestration now only composes feature components and shared API configuration to keep root component maintainable.
import { ref } from "vue";
import ApiBaseUrlField from "./components/api/ApiBaseUrlField.vue";
import HealthCheckCard from "./components/api/HealthCheckCard.vue";
import OpenApiSummary from "./components/api/OpenApiSummary.vue";
import PdfMergeCard from "./components/api/PdfMergeCard.vue";

const apiBaseUrl = ref(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000");
</script>

<template>
  <div class="portal-page">
    <header class="hero">
      <p class="hero__badge">Softaware Tools API Client</p>
      <h1 class="hero__title">Frontend wired to current OpenAPI contract</h1>
      <p class="hero__subtitle">
        Current backend surface includes health checks and PDF merge. This screen is now the
        baseline for integrating those endpoints.
      </p>
      <ApiBaseUrlField v-model="apiBaseUrl" />
    </header>

    <main class="tools-layout">
      <div>
        <HealthCheckCard :api-base-url="apiBaseUrl" />
        <PdfMergeCard :api-base-url="apiBaseUrl" />
      </div>
      <OpenApiSummary />
    </main>
  </div>
</template>
