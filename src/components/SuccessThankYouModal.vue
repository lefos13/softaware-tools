<script setup>
/*
  Shared success overlay keeps post-processing actions consistent across services.
  It surfaces the result download immediately and includes the donation prompt in one place.
*/
import DonationPrompt from "./DonationPrompt.vue";

defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Your file is ready",
  },
  downloadUrl: {
    type: String,
    default: "",
  },
  downloadName: {
    type: String,
    default: "result-file",
  },
  description: {
    type: String,
    default: "Download your output file below.",
  },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div
    v-if="visible"
    class="success-overlay"
    role="dialog"
    aria-modal="true"
    aria-live="polite"
    @click.self="emit('close')"
  >
    <article class="success-overlay__card">
      <button
        type="button"
        class="button button--secondary success-overlay__close"
        @click="emit('close')"
      >
        Close
      </button>
      <p class="success-overlay__title">{{ title }}</p>
      <p class="success-overlay__text">{{ description }}</p>
      <a
        class="button button--primary success-overlay__download"
        :href="downloadUrl"
        :download="downloadName"
      >
        Download {{ downloadName }}
      </a>
      <DonationPrompt compact />
    </article>
  </div>
</template>
