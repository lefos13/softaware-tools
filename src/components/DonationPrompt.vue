<script setup>
import { HAS_CUSTOM_PAYPAL_DONATE_URL, PAYPAL_DONATE_URL } from "../config/donation";

defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <aside class="donation-prompt" :class="{ 'donation-prompt--compact': compact }">
    <p class="donation-prompt__badge">Support this project</p>
    <h3 class="donation-prompt__title">Keep these APIs alive and functional</h3>
    <p class="donation-prompt__text">
      If this service helped you, please consider a small donation via PayPal.
    </p>
    <a
      class="button button--primary donation-prompt__button"
      :href="PAYPAL_DONATE_URL"
      target="_blank"
      rel="noopener noreferrer"
    >
      Donate with PayPal
    </a>
    <p v-if="!HAS_CUSTOM_PAYPAL_DONATE_URL" class="donation-prompt__hint">
      Set <code>VITE_PAYPAL_DONATE_URL</code> to your PayPal donation link.
    </p>
  </aside>
</template>
