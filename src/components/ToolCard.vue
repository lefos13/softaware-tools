<script setup>
// Why this exists: service launcher cards are full-click targets so users can enter flows with one clean interaction.
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
  icon: {
    type: String,
    default: "grid",
  },
  variant: {
    type: String,
    default: "default",
  },
});

const emit = defineEmits(["action"]);
</script>

<template>
  <button
    type="button"
    class="tool-card tool-card--launcher tool-card--launcher-click"
    :class="`tool-card--${variant}`"
    @click="emit('action')"
  >
    <div class="tool-card__visual" aria-hidden="true">
      <svg viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="10"
          y="15"
          width="80"
          height="80"
          rx="18"
          class="tool-card__shape tool-card__shape--a"
        />
        <circle cx="126" cy="55" r="34" class="tool-card__shape tool-card__shape--b" />
        <rect
          x="154"
          y="28"
          width="56"
          height="56"
          rx="16"
          class="tool-card__shape tool-card__shape--c"
        />
      </svg>
      <span class="tool-card__icon-badge">
        <svg v-if="icon === 'pdf'" viewBox="0 0 24 24" class="tool-card__icon" aria-hidden="true">
          <path
            d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 1.5V9h4.5M9 14h1.2c.9 0 1.5.6 1.5 1.5S11.1 17 10.2 17H9v-3Zm0 1h1.1c.3 0 .6.2.6.5s-.3.5-.6.5H9V15Zm4-1h1.1c1 0 1.9.8 1.9 1.9s-.9 2.1-1.9 2.1H13v-4Zm1 1v2h.2c.5 0 .9-.4.9-1.1 0-.6-.4-.9-.9-.9H14Zm3-1h2v1h-1v3h-1v-3h0v-1Z"
          />
        </svg>
        <svg
          v-else-if="icon === 'image'"
          viewBox="0 0 24 24"
          class="tool-card__icon"
          aria-hidden="true"
        >
          <path
            d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h12V6H6Zm9 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 16h8l-2.8-3.4a.8.8 0 0 0-1.2 0L10.6 14 9.5 12.7a.8.8 0 0 0-1.2 0L8 13.1V16Z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="tool-card__icon" aria-hidden="true">
          <path
            d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm12 0h4v4h-4v-4Zm-3 0h2v2h-2v-2Zm0 3h2v2h-2v-2Zm3 3h4v1h-4v-1Z"
          />
        </svg>
      </span>
    </div>
    <p class="tool-card__tag">{{ tag }}</p>
    <h3 class="tool-card__title">{{ title }}</h3>
    <p class="tool-card__description">{{ description }}</p>
  </button>
</template>
