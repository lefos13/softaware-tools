<script setup lang="ts">
/*
  Workspace view resolves tool id from dynamic route path and renders a single
  reusable runner component for all JSON mini tools.
*/
import { computed, inject } from "vue";
import JsonToolWorkspace from "../components/json/JsonToolWorkspace.vue";
import { localizeJsonToolDefinition, usePortalI18n } from "../i18n";
import { JSON_TOOL_BY_ID } from "../services/jsonTools/registry";
import type { LocaleCode, PortalI18n, PortalRouter } from "../types/shared";
import type { JsonToolDefinition } from "../types/jsonTools";
import { portalRouterKey } from "../types/shared";

const portalRouter = inject(portalRouterKey) as PortalRouter | undefined;
const i18n = usePortalI18n() as PortalI18n;

if (!portalRouter) {
  throw new Error("Portal router is not available.");
}

const toolId = computed(() => {
  const path = portalRouter.currentPath.value;
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || "";
});

const tool = computed(() => {
  const source = (JSON_TOOL_BY_ID as Record<string, JsonToolDefinition | undefined>)[toolId.value];
  return source
    ? (localizeJsonToolDefinition(
        source,
        i18n.locale.value as LocaleCode,
        i18n
      ) as JsonToolDefinition)
    : null;
});

const goBack = () => {
  portalRouter.navigate("/flows/json");
};
</script>

<template>
  <section class="flow-view" aria-label="JSON tool workspace">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ tool ? tool.title : i18n.t("routes.json-tool") }}</h2>
      <p class="section-head__subtitle">
        {{ tool ? tool.description : i18n.t("json.toolNotFound") }}
      </p>
    </div>

    <button type="button" class="button button--secondary" @click="goBack">
      {{ i18n.t("json.back") }}
    </button>

    <article v-if="!tool" class="tool-card">
      <p class="tool-card__description tool-card__description--error">
        {{ i18n.t("json.toolNotFoundHelp") }}
      </p>
    </article>

    <JsonToolWorkspace v-else :tool="tool" />
  </section>
</template>
