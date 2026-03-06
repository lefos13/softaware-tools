<script setup>
/*
  OpenAPI page headings now use the shared translation store so the technical
  contract screen follows the same locale toggle as the rest of the portal.
*/
import { inject } from "vue";
import OpenApiSummary from "../components/api/OpenApiSummary.vue";
import SwaggerViewer from "../components/api/SwaggerViewer.vue";
import { usePortalI18n } from "../i18n";

const portalContext = inject("portalContext");
const { t } = usePortalI18n();
</script>

<template>
  <section class="flow-view">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("openApi.pageTitle") }}</h2>
      <p class="section-head__subtitle">{{ t("openApi.pageSubtitle") }}</p>
    </div>
    <OpenApiSummary />
    <SwaggerViewer :api-base-url="portalContext.apiBaseUrl.value" />
  </section>
</template>
