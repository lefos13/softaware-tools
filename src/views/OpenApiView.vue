<script setup lang="ts">
/*
  OpenAPI page headings now use the shared translation store so the technical
  contract screen follows the same locale toggle as the rest of the portal.
*/
import { inject } from "vue";
import OpenApiSummary from "../components/api/OpenApiSummary.vue";
import SwaggerViewer from "../components/api/SwaggerViewer.vue";
import { usePortalI18n } from "../i18n";
import type { PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey) as PortalContext | undefined;
const { t } = usePortalI18n() as PortalI18n;

if (!portalContext) {
  throw new Error("Portal context is not available.");
}
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
