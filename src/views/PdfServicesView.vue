<script setup>
/*
  Service metadata is now resolved through the shared translation store so the
  PDF hub stays easy to maintain while showing localized, plain-language copy.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";
import { usePortalI18n } from "../i18n";

const portalRouter = inject("portalRouter");
const { t } = usePortalI18n();

const pdfServices = [
  {
    title: () => t("services.pdfMerge.title"),
    graphic: "pdf-merge",
    description: () => t("services.pdfMerge.description"),
    route: "/flows/pdf",
  },
  {
    title: () => t("services.pdfSplit.title"),
    graphic: "pdf-split",
    description: () => t("services.pdfSplit.description"),
    route: "/flows/pdf-split",
  },
  {
    title: () => t("services.pdfToWord.title"),
    graphic: "pdf-ocr",
    description: () => t("services.pdfToWord.description"),
    route: "/flows/pdf-extract-to-word",
  },
  {
    title: () => t("services.pdfWatermark.title"),
    graphic: "pdf-merge",
    description: () => t("services.pdfWatermark.description"),
    route: "/flows/pdf-watermark",
  },
  {
    title: () => t("services.pdfPageNumbers.title"),
    graphic: "pdf-split",
    description: () => t("services.pdfPageNumbers.description"),
    route: "/flows/pdf-page-numbers",
  },
  {
    title: () => t("services.pdfEditPages.title"),
    graphic: "pdf-split",
    description: () => t("services.pdfEditPages.description"),
    route: "/flows/pdf-edit-pages",
  },
  {
    title: () => t("services.pdfExtractText.title"),
    graphic: "pdf-ocr",
    description: () => t("services.pdfExtractText.description"),
    route: "/flows/pdf-extract-text",
  },
  {
    title: () => t("services.pdfFromImages.title"),
    graphic: "pdf-merge",
    description: () => t("services.pdfFromImages.description"),
    route: "/flows/pdf-from-images",
  },
];

const openService = (route) => {
  portalRouter.navigate(route);
};
</script>

<template>
  <section class="flow-view" aria-label="PDF services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.pdfServices.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.pdfServices.subtitle") }}</p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        v-for="service in pdfServices"
        :key="service.route"
        :title="service.title()"
        tag="PDF"
        :graphic="service.graphic"
        variant="pdf"
        :description="service.description()"
        @action="openService(service.route)"
      />
    </div>
  </section>
</template>
