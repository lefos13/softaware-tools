<script setup>
// Why this exists: PDF merge now runs in its own route so users stay focused on a single task flow.
import { inject } from "vue";
import PdfMergeCard from "../components/api/PdfMergeCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfMergeCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
