<script setup>
/*
  JSON hub cards present concise tool metadata and route users to one shared
  execution workspace driven by the registry definition.
*/
defineProps({
  tool: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["open"]);
</script>

<template>
  <button
    type="button"
    class="tool-card tool-card--launcher tool-card--launcher-click json-tool-card"
    @click="emit('open', tool.id)"
  >
    <p class="tool-card__tag">{{ tool.category }}</p>
    <h3 class="tool-card__title">{{ tool.title }}</h3>
    <p class="tool-card__description">{{ tool.description }}</p>
  </button>
</template>
