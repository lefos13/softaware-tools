<script setup>
// Why this exists: the Greek literature editor gets its own route so users can focus on one manuscript correction flow at a time.
import { inject } from "vue";
import ServiceFlowShell from "../components/api/ServiceFlowShell.vue";
import BooksGreekEditorCard from "../components/api/BooksGreekEditorCard.vue";

const portalContext = inject("portalContext");
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
