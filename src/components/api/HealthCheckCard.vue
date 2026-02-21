<script setup>
// This component now surfaces backend success message and request reference to help users and support teams diagnose issues quickly.
import { useHealthCheck } from "../../composables/useHealthCheck";

const props = defineProps({
  apiBaseUrl: {
    type: String,
    required: true,
  },
});

const { loading, status, message, requestId, error, run } = useHealthCheck();
</script>

<template>
  <section aria-labelledby="health-endpoint">
    <div class="section-head">
      <h2 id="health-endpoint" class="section-head__title">Health Endpoint</h2>
      <p class="section-head__subtitle">GET /api/health</p>
    </div>

    <div class="tool-card">
      <button
        type="button"
        class="button button--primary"
        :disabled="loading"
        @click="run(props.apiBaseUrl)"
      >
        {{ loading ? "Checking..." : "Run Health Check" }}
      </button>
      <p v-if="status" class="tool-card__description">
        Service status: <strong>{{ status }}</strong>
      </p>
      <p v-if="message" class="tool-card__description">{{ message }}</p>
      <p v-if="requestId" class="tool-card__description">
        Request reference: <code>{{ requestId }}</code>
      </p>
      <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    </div>
  </section>
</template>
