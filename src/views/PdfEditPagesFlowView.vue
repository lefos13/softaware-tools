<script setup>
/*
  Route wrapper keeps edit-pages flow isolated and aligned with the shared
  flow-view shell used across all PDF and image tools.
*/
import { inject } from "vue";
import PdfEditPagesCard from "../components/api/PdfEditPagesCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfEditPagesCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
