<script setup>
/*
  Header remains compact/full-width, while route hierarchy is shown in a
  dedicated breadcrumb bar below it for clearer inner-flow navigation.
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
      ![
        "pdf",
        "pdf-services",
        "pdf-split",
        "pdf-extract-to-word",
        "pdf-watermark",
        "pdf-page-numbers",
        "pdf-edit-pages",
        "pdf-extract-text",
        "pdf-from-images",
        "image",
        "image-services",
        "image-convert",
        "json-services",
        "json-tool",
      ].includes(route.name)
  )
);
const pageTitle = computed(() => {
  const titles = {
    home: "Service Launcher",
    "pdf-services": "PDF Services",
    pdf: "PDF Merge Flow",
    "pdf-split": "PDF Split Flow",
    "pdf-extract-to-word": "PDF to Word Extraction Flow",
    "pdf-watermark": "PDF Watermark Flow",
    "pdf-page-numbers": "PDF Page Numbers / Bates Flow",
    "pdf-edit-pages": "PDF Edit Pages Flow",
    "pdf-extract-text": "PDF Extract Text Flow",
    "pdf-from-images": "Images to PDF Flow",
    "image-services": "Image Services",
    image: "Image Compression Flow",
    "image-convert": "Image Convert Flow",
    "json-services": "JSON Services",
    "json-tool": "JSON Tool Workspace",
    contract: "OpenAPI Contract",
    "admin-reports": "Admin Reports",
    donate: "Support / Donate",
  };

  return titles[activeRouteName.value] || "Softaware Tools";
});

/*
  Breadcrumbs provide one-click upward navigation from inner routes while
  keeping the top header minimal and visually stable.
*/
const breadcrumbs = computed(() => {
  const byName = {
    home: [{ label: "Home", path: "/" }],
    "pdf-services": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
    ],
    pdf: [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Merge", path: "/flows/pdf" },
    ],
    "pdf-split": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Split", path: "/flows/pdf-split" },
    ],
    "pdf-extract-to-word": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF to Word", path: "/flows/pdf-extract-to-word" },
    ],
    "pdf-watermark": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Watermark", path: "/flows/pdf-watermark" },
    ],
    "pdf-page-numbers": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Page Numbers", path: "/flows/pdf-page-numbers" },
    ],
    "pdf-edit-pages": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Edit Pages", path: "/flows/pdf-edit-pages" },
    ],
    "pdf-extract-text": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "PDF Extract Text", path: "/flows/pdf-extract-text" },
    ],
    "pdf-from-images": [
      { label: "Home", path: "/" },
      { label: "PDF Services", path: "/flows/pdf-services" },
      { label: "Images to PDF", path: "/flows/pdf-from-images" },
    ],
    "image-services": [
      { label: "Home", path: "/" },
      { label: "Image Services", path: "/flows/image-services" },
    ],
    image: [
      { label: "Home", path: "/" },
      { label: "Image Services", path: "/flows/image-services" },
      { label: "Image Compression", path: "/flows/image" },
    ],
    "image-convert": [
      { label: "Home", path: "/" },
      { label: "Image Services", path: "/flows/image-services" },
      { label: "Image Convert", path: "/flows/image-convert" },
    ],
    "json-services": [
      { label: "Home", path: "/" },
      { label: "JSON Services", path: "/flows/json" },
    ],
    "json-tool": [
      { label: "Home", path: "/" },
      { label: "JSON Services", path: "/flows/json" },
      { label: "Tool", path: currentPath.value },
    ],
    contract: [
      { label: "Home", path: "/" },
      { label: "API Contract", path: "/contract/openapi" },
    ],
    "admin-reports": [
      { label: "Home", path: "/" },
      { label: "Admin Reports", path: "/admin/reports" },
    ],
    donate: [
      { label: "Home", path: "/" },
      { label: "Donate", path: "/donate" },
    ],
  };

  return byName[activeRouteName.value] || [{ label: "Home", path: "/" }];
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
  <div class="portal-app">
    <header class="portal-header">
      <div class="portal-header__inner">
        <div class="portal-header__top">
          <div>
            <p class="hero__badge">Softaware Tools API Client</p>
            <h1 class="hero__title">{{ pageTitle }}</h1>
          </div>
          <p class="hero__status" :class="isHealthy ? 'hero__status--ok' : 'hero__status--down'">
            API guard: {{ checking ? "checking..." : status }}
            <span v-if="lastCheckedAt"> · {{ new Date(lastCheckedAt).toLocaleTimeString() }}</span>
          </p>
        </div>

        <div class="portal-header__row">
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
        </div>
      </div>
    </header>

    <main class="portal-page route-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <template v-for="(crumb, index) in breadcrumbs" :key="`${crumb.path}-${index}`">
          <a
            v-if="index < breadcrumbs.length - 1"
            :href="crumb.path"
            class="breadcrumb__link"
            @click="onNavigate(crumb.path, $event)"
          >
            {{ crumb.label }}
          </a>
          <span v-else class="breadcrumb__current" aria-current="page">{{ crumb.label }}</span>
          <span v-if="index < breadcrumbs.length - 1" class="breadcrumb__sep" aria-hidden="true">
            /
          </span>
        </template>
      </nav>
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
