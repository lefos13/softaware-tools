<script setup lang="ts">
/*
  Donation copy now comes from the shared translation store so the support CTA
  stays aligned with the selected language in both the page and success modal.
*/
import { HAS_CUSTOM_PAYPAL_DONATE_URL, PAYPAL_DONATE_URL } from "../config/donation";
import { usePortalI18n } from "../i18n";
import type { PortalI18n } from "../types/shared";

defineProps<{
  compact?: boolean;
}>();

const { t } = usePortalI18n() as PortalI18n;
</script>

<template>
  <aside class="donation-prompt" :class="{ 'donation-prompt--compact': compact }">
    <p class="donation-prompt__badge">{{ t("donation.badge") }}</p>
    <h3 class="donation-prompt__title">{{ t("donation.title") }}</h3>
    <p class="donation-prompt__text">{{ t("donation.text") }}</p>
    <a
      class="button button--primary donation-prompt__button"
      :href="PAYPAL_DONATE_URL"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ t("donation.cta") }}
    </a>
    <p v-if="!HAS_CUSTOM_PAYPAL_DONATE_URL" class="donation-prompt__hint">
      {{ t("donation.hint") }}
    </p>
  </aside>
</template>
