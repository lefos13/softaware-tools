<script setup lang="ts">
/*
  Success modal labels now come from the shared translation store so completion
  messaging stays localized while individual tools still control the result copy.
*/
import DonationPrompt from "./DonationPrompt.vue";
import { usePortalI18n } from "../i18n";
import type { PortalI18n } from "../types/shared";

const { t } = usePortalI18n() as PortalI18n;

defineProps<{
  visible: boolean;
  title?: string;
  downloadUrl?: string;
  downloadName?: string;
  description?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
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
        {{ t("modal.close") }}
      </button>
      <p class="success-overlay__title">{{ title || t("modal.defaultTitle") }}</p>
      <p class="success-overlay__text">{{ description || t("modal.defaultDescription") }}</p>
      <a
        class="button button--primary success-overlay__download"
        :href="downloadUrl"
        :download="downloadName"
      >
        {{ t("modal.download", { name: downloadName }) }}
      </a>
      <DonationPrompt compact />
    </article>
  </div>
</template>
