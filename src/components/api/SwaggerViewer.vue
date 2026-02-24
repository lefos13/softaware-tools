<script setup>
// Why this exists: OpenAPI consumers need a first-class interactive API explorer, so this component renders the backend contract in the official Swagger UI layout.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { buildUrl } from "../../services/apiClient";

const props = defineProps({
  apiBaseUrl: {
    type: String,
    required: true,
  },
});

const mountNode = ref(null);
const error = ref("");

let swaggerInstance = null;
let swaggerModulePromise = null;

const loadSwaggerUiModule = async () => {
  if (!swaggerModulePromise) {
    swaggerModulePromise = Promise.all([
      import("swagger-ui-dist/swagger-ui-es-bundle"),
      import("swagger-ui-dist/swagger-ui.css"),
    ]).then(([module]) => module.default);
  }

  return swaggerModulePromise;
};

const renderSwagger = async () => {
  if (!mountNode.value) {
    return;
  }

  error.value = "";

  if (swaggerInstance?.destroy) {
    swaggerInstance.destroy();
  }

  try {
    const SwaggerUI = await loadSwaggerUiModule();
    swaggerInstance = SwaggerUI({
      domNode: mountNode.value,
      url: buildUrl(props.apiBaseUrl, "/api/openapi.json"),
      layout: "BaseLayout",
      deepLinking: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      showExtensions: true,
      showCommonExtensions: true,
      presets: [SwaggerUI.presets.apis],
      onFailure: () => {
        error.value = `Could not load OpenAPI JSON from ${buildUrl(props.apiBaseUrl, "/api/openapi.json")}`;
      },
    });
  } catch {
    error.value = "Swagger UI could not be initialized";
  }
};

watch(
  () => props.apiBaseUrl,
  () => {
    void renderSwagger();
  }
);

onMounted(() => {
  void renderSwagger();
});

onBeforeUnmount(() => {
  if (swaggerInstance?.destroy) {
    swaggerInstance.destroy();
  }
  swaggerInstance = null;
});
</script>

<template>
  <section class="swagger-card" aria-label="Swagger contract viewer">
    <div class="section-head section-head--spaced">
      <h3 class="section-head__title">Swagger Explorer</h3>
      <p class="section-head__subtitle">
        Live contract from <code>{{ apiBaseUrl }}/api/openapi.json</code>
      </p>
    </div>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    <div ref="mountNode" class="swagger-host" />
  </section>
</template>

<style scoped>
.swagger-card {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.swagger-host {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.swagger-host :deep(.swagger-ui) {
  font-family: "Avenir Next", "Segoe UI", sans-serif;
}

.swagger-host :deep(.topbar) {
  display: none;
}
</style>
