<script setup>
/*
  Workspace view resolves tool id from dynamic route path and renders a single
  reusable runner component for all JSON mini tools.
*/
import { computed, inject } from "vue";
import JsonToolWorkspace from "../components/json/JsonToolWorkspace.vue";
import { localizeJsonTool, usePortalI18n } from "../i18n";
import { JSON_TOOL_BY_ID } from "../services/jsonTools/registry";

const portalRouter = inject("portalRouter");
const { t, locale } = usePortalI18n();

const toolId = computed(() => {
  const path = portalRouter.currentPath.value;
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
});

const tool = computed(() => {
  const source = JSON_TOOL_BY_ID[toolId.value];
  return source ? localizeJsonTool(source, { t, locale: locale.value }) : null;
});

const goBack = () => {
  portalRouter.navigate("/flows/json");
};
</script>

<template>
  <section class="flow-view" aria-label="JSON tool workspace">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ tool ? tool.title : t("routes.json-tool") }}</h2>
      <p class="section-head__subtitle">{{ tool ? tool.description : t("json.toolNotFound") }}</p>
    </div>

    <button type="button" class="button button--secondary" @click="goBack">
      {{ t("json.back") }}
    </button>

    <article v-if="!tool" class="tool-card">
      <p class="tool-card__description tool-card__description--error">
        {{ t("json.toolNotFoundHelp") }}
      </p>
    </article>

    <JsonToolWorkspace v-else :tool="tool" />
  </section>
</template>
