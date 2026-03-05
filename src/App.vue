<script setup>
/*
  Navigation now highlights Donate as a stronger CTA while preserving route behavior.
  This keeps support access visible without using a home launcher card.
*/
import { computed, onBeforeUnmount, provide, ref } from "vue";
import { useHealthCheck } from "./composables/useHealthCheck";
import { createPortalRouter } from "./router/router";

const apiBaseUrl = ref(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000");

const { checking, hasChecked, isHealthy, status, message, requestId, error, lastCheckedAt } =
  useHealthCheck(apiBaseUrl);

const router = createPortalRouter();

provide("portalContext", {
  apiBaseUrl,
  checking,
  hasChecked,
  isHealthy,
  status,
  message,
  requestId,
  error,
  lastCheckedAt,
});
provide("portalRouter", router);

const showGuardOverlay = computed(() => hasChecked.value && !isHealthy.value);
const activeRouteName = computed(() => router.currentRoute.value.name);
const currentPath = computed(() => router.currentPath.value);
const currentComponent = computed(() => router.currentComponent.value);
const navigationRoutes = computed(() =>
  router.routes.filter(
    (route) =>
      !["pdf", "pdf-split", "pdf-extract-to-word", "image", "image-convert"].includes(route.name)
  )
);
const pageTitle = computed(() => {
  const titles = {
    home: "Service Launcher",
    pdf: "PDF Merge Flow",
    "pdf-split": "PDF Split Flow",
    "pdf-extract-to-word": "PDF to Word Extraction Flow",
    image: "Image Compression Flow",
    "image-convert": "Image Convert Flow",
    contract: "OpenAPI Contract",
    "admin-reports": "Admin Reports",
    donate: "Support / Donate",
  };

  return titles[activeRouteName.value] || "Softaware Tools";
});
const pageSummary = computed(() => {
  const summaries = {
    home: "Start here to pick a service. Each tool has its own guided workflow and a clear final download step.",
    pdf: "Merge multiple PDF files into one document, with ordering and rotation controls before you generate the final file.",
    "pdf-split":
      "Split one PDF into smaller outputs using ranges, selected pages, repeated chunks, or custom named groups.",
    "pdf-extract-to-word":
      "Extract text from regular or scanned PDFs and produce an editable Word document with OCR-aware options.",
    image:
      "Compress one or many images to reduce file size while balancing quality and performance for your use case.",
    "image-convert":
      "Convert images into different formats and optionally remove background for transparent-ready assets.",
    contract:
      "Review the live OpenAPI contract so front-end and back-end request/response structures stay aligned.",
    "admin-reports":
      "Inspect operational and task reports to monitor system behavior, outcomes, and troubleshooting details.",
    donate:
      "Support ongoing maintenance and reliability of these services through a secure PayPal contribution.",
  };

  return (
    summaries[activeRouteName.value] || "Choose a tool and continue with a focused, guided flow."
  );
});

const onNavigate = (path, event) => {
  event.preventDefault();
  router.navigate(path);
};

onBeforeUnmount(() => {
  router.dispose();
});
</script>

<template>
  <div class="portal-page">
    <header class="hero">
      <p class="hero__badge">Softaware Tools API Client</p>
      <h1 class="hero__title">{{ pageTitle }}</h1>
      <p class="hero__subtitle">{{ pageSummary }}</p>

      <nav class="top-nav" aria-label="Portal navigation">
        <a
          v-for="route in navigationRoutes"
          :key="route.path"
          :href="route.path"
          class="top-nav__link"
          :class="{
            'top-nav__link--active': currentPath === route.path,
            'top-nav__link--donate': route.name === 'donate',
          }"
          @click="onNavigate(route.path, $event)"
        >
          {{ route.label }}
        </a>
      </nav>

      <p class="hero__status" :class="isHealthy ? 'hero__status--ok' : 'hero__status--down'">
        API guard: {{ checking ? "checking..." : status }}
        <span v-if="lastCheckedAt"> · {{ new Date(lastCheckedAt).toLocaleTimeString() }}</span>
      </p>
    </header>

    <main class="route-shell">
      <component :is="currentComponent" />
    </main>

    <div v-if="showGuardOverlay" class="guard-overlay" role="alert" aria-live="assertive">
      <div class="guard-overlay__card">
        <p class="guard-overlay__title">Server is down</p>
        <p class="guard-overlay__text">
          API guard blocked tool actions because <code>{{ apiBaseUrl }}</code> is not healthy.
        </p>
        <p class="guard-overlay__text">
          Request reference: <code>{{ requestId || "n/a" }}</code>
        </p>
        <p v-if="error" class="guard-overlay__text">{{ error }}</p>
        <p v-else class="guard-overlay__text">{{ message }}</p>
      </div>
    </div>
  </div>
</template>
