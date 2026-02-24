<script setup>
// Why this exists: PDF split runs in its own route so users can configure split logic without merge-flow UI complexity.
import { inject } from "vue";
import PdfSplitCard from "../components/api/PdfSplitCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfSplitCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
