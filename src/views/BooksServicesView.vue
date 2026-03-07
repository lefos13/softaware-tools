<script setup>
/*
  Books services get a dedicated launcher so manuscript-specific flows can be
  grouped separately from the broader PDF and image tool families.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";
import { usePortalI18n } from "../i18n";

const portalRouter = inject("portalRouter");
const { t } = usePortalI18n();

const bookServices = [
  {
    title: () => t("services.booksGreekEditor.title"),
    graphic: "books-editor",
    description: () => t("services.booksGreekEditor.description"),
    route: "/flows/books-greek-editor",
  },
];

const openService = (route) => {
  portalRouter.navigate(route);
};
</script>

<template>
  <section class="flow-view" aria-label="Books services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.booksServices.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.booksServices.subtitle") }}</p>
    </div>

    <div class="launcher-grid launcher-grid--compact">
      <ToolCard
        v-for="service in bookServices"
        :key="service.route"
        :title="service.title()"
        :tag="t('routes.books-services')"
        :graphic="service.graphic"
        variant="books"
        :description="service.description()"
        @action="openService(service.route)"
      />
    </div>
  </section>
</template>
