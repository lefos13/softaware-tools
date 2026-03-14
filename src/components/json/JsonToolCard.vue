<script setup lang="ts">
/*
  JSON hub cards now include deterministic per-tool graphics so each subservice
  is visually distinct while still following one shared card component.
*/
import { computed } from "vue";
import JsonToolCardGraphicAsset from "../../assets/svgs/JsonToolCardGraphicAsset.vue";

interface JsonToolCardData {
  id: string;
  category: string;
  title: string;
  description: string;
}

const props = defineProps<{
  tool: JsonToolCardData;
}>();

const emit = defineEmits<{
  open: [toolId: string];
}>();

const seed = computed(() => {
  const source = `${props.tool.id}:${props.tool.category}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return hash;
});

const barHeights = computed(() => [
  18 + (seed.value % 18),
  18 + ((seed.value >> 3) % 18),
  18 + ((seed.value >> 6) % 18),
]);

const categoryGlyph = computed(() => {
  const glyphByCategory = {
    Format: "M48 28h44M48 40h36M48 52h44",
    Convert: "M45 36h16v-10l12 12-12 12V40H45M79 54H63v10L51 52l12-12v10h16",
    Analyze: "M48 58l12-14 10 10 12-16",
    Compare: "M48 36h20M48 52h20M84 36h-20M84 52h-20",
    Structure: "M52 30h28v28H52zM44 42h8M80 42h8M66 58v8",
    Protect: "M66 30l18 8v12c0 10-7 16-18 20-11-4-18-10-18-20V38l18-8z",
    Visual: "M46 54l10-10 8 8 12-14 10 16H46z",
  };

  return (
    glyphByCategory[props.tool.category as keyof typeof glyphByCategory] || glyphByCategory.Format
  );
});
</script>

<template>
  <button
    type="button"
    class="tool-card tool-card--launcher tool-card--launcher-click json-tool-card json-tool-card--with-visual"
    @click="emit('open', tool.id)"
  >
    <div class="json-tool-card__visual" aria-hidden="true">
      <JsonToolCardGraphicAsset :bar-heights="barHeights" :category-glyph="categoryGlyph" />
    </div>
    <p class="tool-card__tag">{{ tool.category }}</p>
    <h3 class="tool-card__title">{{ tool.title }}</h3>
    <p class="tool-card__description">{{ tool.description }}</p>
  </button>
</template>
