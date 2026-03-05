<script setup>
/*
  PDF Services hub mirrors JSON Services behavior by listing PDF subservices in
  one place before users enter a specific tool flow.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";

const portalRouter = inject("portalRouter");

const pdfServices = [
  {
    title: "PDF Merge",
    graphic: "pdf-merge",
    description:
      "Combine multiple PDF files into one clean document in the exact order you choose.",
    route: "/flows/pdf",
  },
  {
    title: "PDF Split",
    graphic: "pdf-split",
    description:
      "Break one PDF into smaller files by page range, selected pages, or custom groups.",
    route: "/flows/pdf-split",
  },
  {
    title: "PDF to Word OCR",
    graphic: "pdf-ocr",
    description: "Turn PDF content into an editable Word file, including scanned pages with OCR.",
    route: "/flows/pdf-extract-to-word",
  },
];

const openService = (route) => {
  portalRouter.navigate(route);
};
</script>

<template>
  <section class="flow-view" aria-label="PDF services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">PDF Services</h2>
      <p class="section-head__subtitle">
        Select a PDF subservice to start a focused upload-to-download workflow.
      </p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        v-for="service in pdfServices"
        :key="service.route"
        :title="service.title"
        tag="PDF"
        :graphic="service.graphic"
        variant="pdf"
        :description="service.description"
        @action="openService(service.route)"
      />
    </div>
  </section>
</template>
