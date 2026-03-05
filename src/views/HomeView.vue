<script setup>
/*
  Home launcher now focuses only on service workflows.
  Support actions remain available from navigation instead of a dedicated card.
*/
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
        Choose what you want to do. Each service opens a guided screen with simple steps from upload
        to final download.
      </p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        title="PDF Merge"
        tag="PDF"
        graphic="pdf-merge"
        variant="pdf"
        description="Combine multiple PDF files into one clean document in the exact order you choose."
        @action="goTo('/flows/pdf')"
      />
      <ToolCard
        title="PDF Split"
        tag="PDF"
        graphic="pdf-split"
        variant="pdf"
        description="Break one PDF into smaller files by page range, selected pages, or custom groups."
        @action="goTo('/flows/pdf-split')"
      />
      <ToolCard
        title="PDF to Word OCR"
        tag="PDF"
        graphic="pdf-ocr"
        variant="pdf"
        description="Turn PDF content into an editable Word file, including scanned pages with OCR."
        @action="goTo('/flows/pdf-extract-to-word')"
      />
      <ToolCard
        title="Image Compression"
        tag="Image"
        graphic="image-compress"
        variant="image"
        description="Reduce image file sizes while keeping quality good for sharing, upload, or web use."
        @action="goTo('/flows/image')"
      />
      <ToolCard
        title="Image Convert / Background removal"
        tag="Image"
        graphic="image-convert"
        variant="image"
        description="Convert image formats and optionally remove backgrounds for cleaner final assets."
        @action="goTo('/flows/image-convert')"
      />
    </div>
  </section>
</template>
