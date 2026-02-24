<script setup>
// Why this exists: OpenAPI analysis is moved out of user processing flows to keep task UIs focused.
import { inject } from "vue";
import OpenApiSummary from "../components/api/OpenApiSummary.vue";
import SwaggerViewer from "../components/api/SwaggerViewer.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">API Contract Analysis</h2>
      <p class="section-head__subtitle">
        Contract notes and operational constraints for frontend/backend alignment.
      </p>
    </div>
    <OpenApiSummary />
    <SwaggerViewer :api-base-url="portalContext.apiBaseUrl.value" />
  </section>
</template>
