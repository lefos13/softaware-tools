<script setup>
/*
  Route wrapper keeps extract-text flow consistent with the portal's existing
  per-service composition pattern using shared API context injection.
*/
import { inject } from "vue";
import PdfExtractTextCard from "../components/api/PdfExtractTextCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfExtractTextCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
