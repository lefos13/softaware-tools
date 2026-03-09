<script setup>
// Why this exists: image compression now has a dedicated route to keep flow UX isolated and scalable.
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import ImageCompressionCard from "../components/api/ImageCompressionCard.vue";

const portalContext = inject("portalContext");
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="image" :api-healthy="portalContext.isHealthy.value">
      <ImageCompressionCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
