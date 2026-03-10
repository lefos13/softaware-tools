<script setup lang="ts">
/*
  Books services get a dedicated launcher so manuscript-specific flows can be
  grouped separately from the broader PDF and image tool families.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";
import { usePortalI18n } from "../i18n";
import type { PortalI18n, PortalRouter } from "../types/shared";
import { portalRouterKey } from "../types/shared";

interface LauncherService {
  title: () => string;
  graphic: string;
  description: () => string;
  route: string;
}

const portalRouter = inject(portalRouterKey) as PortalRouter | undefined;
const { t } = usePortalI18n() as PortalI18n;

if (!portalRouter) {
  throw new Error("Portal router is not available.");
}

const bookServices: LauncherService[] = [
  {
    title: () => t("services.booksGreekEditor.title"),
    graphic: "books-editor",
    description: () => t("services.booksGreekEditor.description"),
    route: "/flows/books-greek-editor",
  },
];

const openService = (route: string) => {
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
