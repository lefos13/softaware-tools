<script setup>
/*
  JSON Services hub groups all mini tools by category and routes each card to
  the shared workspace while keeping discovery fast on desktop and mobile.
*/
import { computed, inject, ref } from "vue";
import JsonToolCard from "../components/json/JsonToolCard.vue";
import { localizeJsonTool, usePortalI18n } from "../i18n";
import { JSON_TOOLS, JSON_TOOL_CATEGORIES } from "../services/jsonTools/registry";

const portalRouter = inject("portalRouter");
const { t, locale } = usePortalI18n();
const searchTerm = ref("");
const localizedTools = computed(() =>
  JSON_TOOLS.map((tool) => localizeJsonTool(tool, { t, locale: locale.value }))
);
const localizedCategories = computed(() =>
  JSON_TOOL_CATEGORIES.map((category) => ({
    source: category,
    label: t(`json.categories.${category}`, {}, category),
  }))
);

const groupedTools = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();
  const filtered = localizedTools.value.filter((tool) => {
    if (!query) {
      return true;
    }

    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  return localizedCategories.value
    .map((category) => ({
      category: category.label,
      items: filtered.filter((tool) => tool.category === category.label),
    }))
    .filter((group) => group.items.length > 0);
});

const openTool = (toolId) => {
  portalRouter.navigate(`/flows/json/${toolId}`);
};
</script>

<template>
  <section class="flow-view" aria-label="JSON services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("json.title") }}</h2>
      <p class="section-head__subtitle">{{ t("json.subtitle") }}</p>
    </div>

    <article class="tool-card">
      <label>
        {{ t("json.searchTools") }}
        <input
          v-model="searchTerm"
          type="text"
          class="rotation-select"
          :placeholder="t('json.searchPlaceholder')"
        />
      </label>
      <p class="tool-card__description">
        {{ t("app.availableTools") }}: {{ localizedTools.length }}
      </p>
    </article>

    <section v-for="group in groupedTools" :key="group.category" class="flow-view">
      <div class="section-head">
        <h3 class="section-head__title">{{ group.category }}</h3>
      </div>
      <div class="json-services-grid">
        <JsonToolCard v-for="tool in group.items" :key="tool.id" :tool="tool" @open="openTool" />
      </div>
    </section>
  </section>
</template>
