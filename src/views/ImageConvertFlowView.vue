<script setup>
// Why this exists: image format conversion has a dedicated route so users can focus on conversion settings separately from compression.
import { inject } from "vue";
import ImageConvertCard from "../components/api/ImageConvertCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <ImageConvertCard
      :api-base-url="portalContext.apiBaseUrl.value"
      :api-healthy="portalContext.isHealthy.value"
    />
  </section>
</template>
