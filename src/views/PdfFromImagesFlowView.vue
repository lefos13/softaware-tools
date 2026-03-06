<script setup>
/*
  Route wrapper keeps images-to-PDF flow integrated with the same injected API
  context and service card structure used by the rest of the portal.
*/
import { inject } from "vue";
import PdfFromImagesCard from "../components/api/PdfFromImagesCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfFromImagesCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
