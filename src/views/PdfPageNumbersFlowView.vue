<script setup lang="ts">
/*
  Route wrapper keeps page-numbering flow consistent with other PDF service
  views and reuses shared portal health/base-url context wiring.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfPageNumbersCard from "../components/api/PdfPageNumbersCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="pdf" :api-healthy="portalContext.isHealthy.value">
      <PdfPageNumbersCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
