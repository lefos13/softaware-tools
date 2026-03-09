<script setup>
/*
  Route wrapper keeps page-numbering flow consistent with other PDF service
  views and reuses shared portal health/base-url context wiring.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfPageNumbersCard from "../components/api/PdfPageNumbersCard.vue";

const portalContext = inject("portalContext");
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
