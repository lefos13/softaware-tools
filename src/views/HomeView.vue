<script setup>
// Why this exists: landing page now acts as a service hub and routes users to dedicated processing flows.
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";

const router = inject("portalRouter");

const goTo = (path) => {
  router.navigate(path);
};
</script>

<template>
  <section class="flow-view" aria-label="Portal launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">Choose Service</h2>
      <p class="section-head__subtitle">
        Pick a dedicated flow. API contract analysis and admin reporting are separated from user
        flows.
      </p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        title="PDF Merge"
        tag="PDF"
        icon="pdf"
        variant="pdf"
        description="Upload PDFs, preview order/rotation, then merge into one final document."
        @action="goTo('/flows/pdf')"
      />
      <ToolCard
        title="Image Compression"
        tag="Image"
        icon="image"
        variant="image"
        description="Compress one or many images using presets or advanced controls."
        @action="goTo('/flows/image')"
      />
    </div>
  </section>
</template>
