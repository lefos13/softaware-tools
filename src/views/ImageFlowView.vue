<script setup lang="ts">
/*
  Dedicated flow routes reuse one injected portal context so service wrappers
  stay thin while each card receives the same health and API base-url state.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import ImageCompressionCard from "../components/api/ImageCompressionCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
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
