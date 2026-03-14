<script setup lang="ts">
/*
  Service cards now render service-specific graphics so users can quickly distinguish tools.
  Visual variants are chosen by a dedicated graphic key passed from the launcher.
*/
import ToolCardGraphicAsset from "../assets/svgs/ToolCardGraphicAsset.vue";

defineProps<{
  title: string;
  description: string;
  tag: string;
  graphic?: string;
  variant?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <button
    type="button"
    class="tool-card tool-card--launcher tool-card--launcher-click"
    :class="`tool-card--${variant}`"
    @click="emit('action')"
  >
    <div class="tool-card__visual" aria-hidden="true">
      <ToolCardGraphicAsset :graphic="graphic" />
    </div>
    <p class="tool-card__tag">{{ tag }}</p>
    <h3 class="tool-card__title">{{ title }}</h3>
    <p class="tool-card__description">{{ description }}</p>
  </button>
</template>
