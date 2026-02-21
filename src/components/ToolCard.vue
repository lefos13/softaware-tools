<script setup>
// This card component now emits an action event so the landing page can route users into dedicated tool flows.
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
  actionLabel: {
    type: String,
    default: "Open Tool",
  },
});

const emit = defineEmits(["action"]);
</script>

<template>
  <article class="tool-card tool-card--launcher">
    <p class="tool-card__tag">{{ tag }}</p>
    <h3 class="tool-card__title">{{ title }}</h3>
    <p class="tool-card__description">{{ description }}</p>
    <button type="button" class="button button--primary" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </article>
</template>
