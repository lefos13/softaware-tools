<script setup lang="ts">
/*
  JSON tool card graphics stay externalized while preserving dynamic bar heights
  and category glyphs that are derived from each tool's deterministic seed.
*/
defineProps<{
  barHeights: number[];
  categoryGlyph: string;
}>();
</script>

<template>
  <svg viewBox="0 0 130 82" class="json-tool-card__graphic">
    <rect x="10" y="8" width="110" height="66" rx="12" class="json-tool-card__shape" />
    <rect
      x="22"
      width="10"
      :height="barHeights[0]"
      :y="64 - barHeights[0]"
      class="json-tool-card__bar"
    />
    <rect
      x="36"
      width="10"
      :height="barHeights[1]"
      :y="64 - barHeights[1]"
      class="json-tool-card__bar"
    />
    <rect
      x="50"
      width="10"
      :height="barHeights[2]"
      :y="64 - barHeights[2]"
      class="json-tool-card__bar"
    />
    <path :d="categoryGlyph" class="json-tool-card__glyph" />
    <circle cx="98" cy="24" r="7" class="json-tool-card__dot" />
  </svg>
</template>
