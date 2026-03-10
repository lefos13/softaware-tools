<script setup lang="ts">
/*
  The donation page now uses the shared translation store so support messaging
  stays friendly and localized without duplicating copy inside the prompt card.
*/
import DonationPrompt from "../components/DonationPrompt.vue";
import { usePortalI18n } from "../i18n";
import type { PortalI18n } from "../types/shared";

const { t } = usePortalI18n() as PortalI18n;
</script>

<template>
  <section class="flow-view" aria-label="Donate to support services">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.donate.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.donate.subtitle") }}</p>
    </div>

    <DonationPrompt />
  </section>
</template>
