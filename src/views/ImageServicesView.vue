<script setup lang="ts">
/*
  Image service cards use the shared translation store so the hub can present
  simpler, localized copy without changing route or card behavior.
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

const imageServices: LauncherService[] = [
  {
    title: () => t("services.imageCompression.title"),
    graphic: "image-compress",
    description: () => t("services.imageCompression.description"),
    route: "/flows/image",
  },
  {
    title: () => t("services.imageConvert.title"),
    graphic: "image-convert",
    description: () => t("services.imageConvert.description"),
    route: "/flows/image-convert",
  },
];

const openService = (route: string) => {
  portalRouter.navigate(route);
};
</script>

<template>
  <section class="flow-view" aria-label="Image services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.imageServices.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.imageServices.subtitle") }}</p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        v-for="service in imageServices"
        :key="service.route"
        :title="service.title()"
        :tag="t('routes.image-services')"
        :graphic="service.graphic"
        variant="image"
        :description="service.description()"
        @action="openService(service.route)"
      />
    </div>
  </section>
</template>
