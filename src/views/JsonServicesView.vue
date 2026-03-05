<script setup>
/*
  JSON Services hub groups all mini tools by category and routes each card to
  the shared workspace while keeping discovery fast on desktop and mobile.
*/
import { computed, inject, ref } from "vue";
import JsonToolCard from "../components/json/JsonToolCard.vue";
import { JSON_TOOLS, JSON_TOOL_CATEGORIES } from "../services/jsonTools/registry";

const portalRouter = inject("portalRouter");
const searchTerm = ref("");

const groupedTools = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();
  const filtered = JSON_TOOLS.filter((tool) => {
    if (!query) {
      return true;
    }

    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  return JSON_TOOL_CATEGORIES.map((category) => ({
    category,
    items: filtered.filter((tool) => tool.category === category),
  })).filter((group) => group.items.length > 0);
});

const openTool = (toolId) => {
  portalRouter.navigate(`/flows/json/${toolId}`);
};
</script>

<template>
  <section class="flow-view" aria-label="JSON services launcher">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">JSON Services</h2>
      <p class="section-head__subtitle">
        Select a JSON mini tool for formatting, conversion, analysis, compare, structure, security,
        and visual export workflows.
      </p>
    </div>

    <article class="tool-card">
      <label>
        Search tools
        <input
          v-model="searchTerm"
          type="text"
          class="rotation-select"
          placeholder="Search by name, category, or description"
        />
      </label>
      <p class="tool-card__description">Available tools: {{ JSON_TOOLS.length }}</p>
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
