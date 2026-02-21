<script setup>
// Added a focused, reusable card component to keep tool links consistent and make future tool additions low-effort.
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
</script>

<template>
  <article class="tool-card">
    <p class="tool-card__tag">{{ tag }}</p>
    <h3 class="tool-card__title">{{ title }}</h3>
    <p class="tool-card__description">{{ description }}</p>
    <button type="button" class="tool-card__button">{{ actionLabel }}</button>
  </article>
</template>
