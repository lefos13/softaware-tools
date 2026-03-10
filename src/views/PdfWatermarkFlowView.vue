<script setup lang="ts">
/*
  Route wrapper keeps watermark flow consistent with other service-specific
  views by injecting shared portal health/base-url context into the card.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfWatermarkCard from "../components/api/PdfWatermarkCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="pdf" :api-healthy="portalContext.isHealthy.value">
      <PdfWatermarkCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
