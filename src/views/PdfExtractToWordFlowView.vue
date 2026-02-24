<script setup>
// Why this exists: OCR extraction gets its own focused route so users can run PDF-to-Word conversion without unrelated controls.
import { inject } from "vue";
import PdfExtractToWordCard from "../components/api/PdfExtractToWordCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <PdfExtractToWordCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
