<script setup lang="ts">
/*
  The route wrapper forwards shared portal state into one focused service card
  so each flow view stays declarative and avoids duplicating health/base-url
  wiring across all dedicated tool routes.
*/
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import BooksGreekEditorCard from "../components/api/BooksGreekEditorCard.vue";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey);

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
</script>

<template>
  <section class="flow-view">
    <ServiceFlowShell service-key="books_greek_editor" :api-healthy="portalContext.isHealthy.value">
      <BooksGreekEditorCard
        :api-base-url="portalContext.apiBaseUrl.value"
        :api-healthy="portalContext.isHealthy.value"
      />
    </ServiceFlowShell>
  </section>
</template>
