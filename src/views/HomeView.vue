<script setup>
/*
  Home now exposes only top-level service families and routes users to
  dedicated subservice hubs where each workflow can be selected.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";

const router = inject("portalRouter");
const jsonServicesEnabled = import.meta.env.VITE_ENABLE_JSON_SERVICES === "true";

const goTo = (path) => {
  router.navigate(path);
};
</script>

<template>
  <section class="flow-view" aria-label="Portal launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">Choose Service</h2>
      <p class="section-head__subtitle">
        Choose what you want to do. Each service opens a guided screen with simple steps from upload
        to final download.
      </p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        title="PDF Services"
        tag="PDF"
        graphic="pdf-merge"
        variant="pdf"
        description="Open PDF subservices: merge, split, and PDF to Word OCR."
        @action="goTo('/flows/pdf-services')"
      />
      <ToolCard
        title="Image Services"
        tag="Image"
        graphic="image-compress"
        variant="image"
        description="Open image subservices: compress and convert."
        @action="goTo('/flows/image-services')"
      />
      <ToolCard
        v-if="jsonServicesEnabled"
        title="JSON Services"
        tag="JSON"
        graphic="json-services"
        variant="json"
        description="Open JSON subservices for formatting, conversion, comparison, analysis, and visual exports."
        @action="goTo('/flows/json')"
      />
    </div>
  </section>
</template>
