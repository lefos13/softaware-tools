<script setup>
/*
  Health status labels now use the shared locale store so the passive API
  guard card stays readable in both supported languages.
*/
import { usePortalI18n } from "../../i18n";

defineProps({
  checking: {
    type: Boolean,
    required: true,
  },
  isHealthy: {
    type: Boolean,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  requestId: {
    type: String,
    required: true,
  },
  error: {
    type: String,
    required: true,
  },
  lastCheckedAt: {
    type: String,
    required: true,
  },
});

const { t, formatTime } = usePortalI18n();
</script>

<template>
  <section aria-labelledby="health-endpoint">
    <div class="section-head">
      <h2 id="health-endpoint" class="section-head__title">{{ t("healthCard.title") }}</h2>
      <p class="section-head__subtitle">{{ t("healthCard.subtitle") }}</p>
    </div>

    <div class="tool-card">
      <p class="tool-card__description">
        {{ t("healthCard.status") }}:
        <strong
          :class="isHealthy ? 'status-pill status-pill--ok' : 'status-pill status-pill--down'"
        >
          {{ checking ? t("app.checking") : status }}
        </strong>
      </p>
      <p class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        {{ t("app.requestReference") }}: <code>{{ requestId }}</code>
      </p>
      <p v-if="lastCheckedAt" class="tool-card__description">
        {{ t("healthCard.lastChecked") }}: {{ formatTime(lastCheckedAt) }}
      </p>
      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    </div>
  </section>
</template>
