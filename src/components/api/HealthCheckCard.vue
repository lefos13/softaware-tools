<script setup>
// This card now presents passive, automated health status instead of a manual trigger so it can act as a UX guardrail.
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
</script>

<template>
  <section aria-labelledby="health-endpoint">
    <div class="section-head">
      <h2 id="health-endpoint" class="section-head__title">API Guard Status</h2>
      <p class="section-head__subtitle">Automatic GET /api/health (every 10s)</p>
    </div>

    <div class="tool-card">
      <p class="tool-card__description">
        Service status:
        <strong
          :class="isHealthy ? 'status-pill status-pill--ok' : 'status-pill status-pill--down'"
        >
          {{ checking ? "checking" : status }}
        </strong>
      </p>
      <p class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="lastCheckedAt" class="tool-card__description">
        Last checked: {{ new Date(lastCheckedAt).toLocaleTimeString() }}
      </p>
      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    </div>
  </section>
</template>
