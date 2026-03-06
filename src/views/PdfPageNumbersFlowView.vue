<script setup>
/*
  Route wrapper keeps page-numbering flow consistent with other PDF service
  views and reuses shared portal health/base-url context wiring.
*/
import { inject } from "vue";
import PdfPageNumbersCard from "../components/api/PdfPageNumbersCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfPageNumbersCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
