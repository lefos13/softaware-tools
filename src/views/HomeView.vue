<script setup>
/*
  Home cards now read from the shared i18n store so the launcher keeps the
  same routing behavior while presenting friendly English and Greek copy.
*/
import { inject } from "vue";
import ToolCard from "../components/ToolCard.vue";
import { usePortalI18n } from "../i18n";

const router = inject("portalRouter");
const { t } = usePortalI18n();
const jsonServicesEnabled = import.meta.env.VITE_ENABLE_JSON_SERVICES === "true";

const goTo = (path) => {
  router.navigate(path);
};
</script>

<template>
  <section class="flow-view" aria-label="Portal launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.home.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.home.subtitle") }}</p>
    </div>

    <div class="launcher-grid">
      <ToolCard
        :title="t('pages.home.pdfServicesTitle')"
        tag="PDF"
        graphic="pdf-merge"
        variant="pdf"
        :description="t('pages.home.pdfServicesDescription')"
        @action="goTo('/flows/pdf-services')"
      />
      <ToolCard
        :title="t('pages.home.imageServicesTitle')"
        :tag="t('routes.image-services')"
        graphic="image-compress"
        variant="image"
        :description="t('pages.home.imageServicesDescription')"
        @action="goTo('/flows/image-services')"
      />
      <ToolCard
        v-if="jsonServicesEnabled"
        :title="t('pages.home.jsonServicesTitle')"
        tag="JSON"
        graphic="json-services"
        variant="json"
        :description="t('pages.home.jsonServicesDescription')"
        @action="goTo('/flows/json')"
      />
    </div>
  </section>
</template>
