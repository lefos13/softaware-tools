<script setup>
// Why this exists: the portal now uses route-based views so each service/admin area is isolated while API guard stays global.
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
  };

  return titles[activeRouteName.value] || "Softaware Tools";
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
      <p class="hero__subtitle">
        Dedicated routes for each service flow, contract docs, and admin operational reports.
      </p>

      <nav class="top-nav" aria-label="Portal navigation">
        <a
          v-for="route in navigationRoutes"
          :key="route.path"
          :href="route.path"
          class="top-nav__link"
          :class="{ 'top-nav__link--active': currentPath === route.path }"
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
