<script setup lang="ts">
/*
  Swagger viewer labels and fallback errors now use the shared locale store so
  the contract explorer matches the selected portal language.
*/
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import { buildUrl } from "../../services/apiClient";
import type { PortalI18n, TemplateRef } from "../../types/shared";

interface SwaggerUiInstance {
  destroy?: () => void;
}

interface SwaggerUiModule {
  (config: {
    domNode: HTMLElement;
    url: string;
    layout: string;
    deepLinking: boolean;
    docExpansion: string;
    defaultModelsExpandDepth: number;
    showExtensions: boolean;
    showCommonExtensions: boolean;
    presets: unknown[];
    onFailure: () => void;
  }): SwaggerUiInstance;
  presets: {
    apis: unknown;
  };
}

const props = defineProps<{
  apiBaseUrl: string;
}>();

const mountNode: TemplateRef<HTMLElement> = ref(null);
const error = ref("");
const { t } = usePortalI18n() as PortalI18n;

let swaggerInstance: SwaggerUiInstance | null = null;
let swaggerModulePromise: Promise<SwaggerUiModule> | null = null;

const loadSwaggerUiModule = async (): Promise<SwaggerUiModule> => {
  if (!swaggerModulePromise) {
    swaggerModulePromise = Promise.all([
      import("swagger-ui-dist/swagger-ui-es-bundle"),
      import("swagger-ui-dist/swagger-ui.css"),
    ]).then(([module]) => module.default as SwaggerUiModule);
  }

  return swaggerModulePromise;
};

const renderSwagger = async (): Promise<void> => {
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

<style src="./SwaggerViewer.scss" lang="scss"></style>
