<script setup>
/*
  Route wrapper keeps extract-text flow consistent with the portal's existing
  per-service composition pattern using shared API context injection.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import PdfExtractTextCard from "../components/api/PdfExtractTextCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="pdf" :api-healthy="portalContext.isHealthy.value">
      <PdfExtractTextCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
