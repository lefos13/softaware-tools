<script setup lang="ts">
/*
  Route wrapper keeps images-to-PDF flow integrated with the same injected API
  context and service card structure used by the rest of the portal.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfFromImagesCard from "../components/api/PdfFromImagesCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="pdf" :api-healthy="portalContext.isHealthy.value">
      <PdfFromImagesCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
