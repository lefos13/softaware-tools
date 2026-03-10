<script setup lang="ts">
/*
  Route wrapper keeps edit-pages flow isolated and aligned with the shared
  flow-view shell used across all PDF and image tools.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfEditPagesCard from "../components/api/PdfEditPagesCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="pdf" :api-healthy="portalContext.isHealthy.value">
      <PdfEditPagesCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
