<script setup>
/*
  Image Services hub mirrors JSON Services behavior by listing image
  subservices before opening a specific image-processing flow.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";

const portalRouter = inject("portalRouter");

const imageServices = [
  {
    title: "Image Compression",
    graphic: "image-compress",
    description:
      "Reduce image file sizes while keeping quality good for sharing, upload, or web use.",
    route: "/flows/image",
  },
  {
    title: "Image Convert / Background removal",
    graphic: "image-convert",
    description:
      "Convert image formats and optionally remove backgrounds for cleaner final assets.",
    route: "/flows/image-convert",
  },
];

const openService = (route) => {
  portalRouter.navigate(route);
};
</script>

<template>
  <section class="flow-view" aria-label="Image services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">Image Services</h2>
      <p class="section-head__subtitle">
        Select an image subservice to run compression or conversion workflows.
      </p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        v-for="service in imageServices"
        :key="service.route"
        :title="service.title"
        tag="Image"
        :graphic="service.graphic"
        variant="image"
        :description="service.description"
        @action="openService(service.route)"
      />
    </div>
  </section>
</template>
