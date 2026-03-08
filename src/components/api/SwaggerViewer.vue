<script setup>
/*
  Swagger viewer labels and fallback errors now use the shared locale store so
  the contract explorer matches the selected portal language.
*/
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import { buildUrl } from "../../services/apiClient";

const props = defineProps({
  apiBaseUrl: {
    type: String,
    required: true,
  },
});

const mountNode = ref(null);
const error = ref("");
const { t } = usePortalI18n();

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
        error.value = t("openApi.swaggerLoadError", {
          url: buildUrl(props.apiBaseUrl, "/api/openapi.json"),
        });
      },
    });
  } catch {
    error.value = t("openApi.swaggerInitError");
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
      <h3 class="section-head__title">{{ t("openApi.swaggerTitle") }}</h3>
      <p class="section-head__subtitle">
        {{ t("openApi.swaggerSubtitle") }} <code>{{ apiBaseUrl }}/api/openapi.json</code>
      </p>
    </div>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    <div ref="mountNode" class="swagger-host" />
  </section>
</template>

<style scoped>
/*
  Swagger content can exceed narrow mobile widths.
  The host now allows horizontal scrolling instead of clipping API operation details.
*/
.swagger-card {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.swagger-host {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  background: #ffffff;
}

.swagger-host :deep(.swagger-ui) {
  font-family: var(--font-sans);
  min-width: 0;
}

.swagger-card .section-head__subtitle code {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.swagger-host :deep(.topbar) {
  display: none;
}
</style>
