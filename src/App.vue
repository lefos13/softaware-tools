<script setup>
/*
  Route labels, breadcrumb text, and the header toggle now read from one
  shared i18n store so English and Greek can switch instantly without
  duplicating routing or health-check logic across the app shell.
*/
import { computed, onBeforeUnmount, provide, ref } from "vue";
import { useHealthCheck } from "./composables/useHealthCheck";
import { usePortalAccess } from "./composables/usePortalAccess";
import { createPortalI18n, PORTAL_I18N_KEY } from "./i18n";
import { createPortalRouter } from "./router/router";

/*
  API calls must target the same host device that serves the UI when the app
  is opened from another phone/laptop on the LAN, otherwise localhost points
  to the visiting device and the backend becomes unreachable.
*/
const resolveApiBaseUrl = () => {
  const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }

  return `http://${window.location.hostname || "localhost"}:3000`;
};

const apiBaseUrl = ref(resolveApiBaseUrl());
const i18n = createPortalI18n();

const { checking, hasChecked, isHealthy, status, message, requestId, error, lastCheckedAt } =
  useHealthCheck(apiBaseUrl);
const portalAccess = usePortalAccess(apiBaseUrl);

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
provide("portalAccess", portalAccess);
provide(PORTAL_I18N_KEY, i18n);

const showGuardOverlay = computed(() => hasChecked.value && !isHealthy.value);
const activeRouteName = computed(() => router.currentRoute.value.name);
const currentPath = computed(() => router.currentPath.value);
const currentComponent = computed(() => router.currentComponent.value);
/*
  Dashboard remains a contextual owner action near language controls, so the
  top navigation excludes it to prevent duplicate entry points in the header.
*/
const navigationRoutes = computed(() =>
  router.routes.filter((route) => {
    if (
      [
        "pdf",
        "pdf-services",
        "pdf-split",
        "pdf-extract-to-word",
        "pdf-watermark",
        "pdf-page-numbers",
        "pdf-edit-pages",
        "pdf-extract-text",
        "pdf-from-images",
        "books-services",
        "books-greek-editor",
        "image",
        "image-services",
        "image-convert",
        "json-services",
        "json-tool",
      ].includes(route.name)
    ) {
      return false;
    }

    if (route.name === "dashboard") {
      return false;
    }

    return true;
  })
);
const pageTitle = computed(() => i18n.t(`routes.${activeRouteName.value}`, {}, "Softaware Tools"));
const statusLabel = computed(() => (checking.value ? i18n.t("app.checking") : status.value));
const toRouteLabel = (routeName) => i18n.t(`routes.${routeName}`, {}, routeName);
const currentPlanType = computed(() => portalAccess?.planType?.value || "free");
const hasResolvedPlan = computed(() => Boolean(portalAccess?.plan?.value));
const setLocale = (locale) => {
  if (locale === i18n.locale.value) {
    return;
  }
  i18n.locale.value = locale;
};

/*
  Breadcrumbs provide one-click upward navigation from inner routes while
  keeping the top header minimal and visually stable.
*/
const breadcrumbs = computed(() => {
  const byName = {
    home: [{ label: toRouteLabel("home"), path: "/" }],
    "pdf-services": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
    ],
    pdf: [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf"), path: "/flows/pdf" },
    ],
    "pdf-split": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-split"), path: "/flows/pdf-split" },
    ],
    "pdf-extract-to-word": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-extract-to-word"), path: "/flows/pdf-extract-to-word" },
    ],
    "pdf-watermark": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-watermark"), path: "/flows/pdf-watermark" },
    ],
    "pdf-page-numbers": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-page-numbers"), path: "/flows/pdf-page-numbers" },
    ],
    "pdf-edit-pages": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-edit-pages"), path: "/flows/pdf-edit-pages" },
    ],
    "pdf-extract-text": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-extract-text"), path: "/flows/pdf-extract-text" },
    ],
    "pdf-from-images": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("pdf-services"), path: "/flows/pdf-services" },
      { label: toRouteLabel("pdf-from-images"), path: "/flows/pdf-from-images" },
    ],
    "books-services": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("books-services"), path: "/flows/books-services" },
    ],
    "books-greek-editor": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("books-services"), path: "/flows/books-services" },
      { label: toRouteLabel("books-greek-editor"), path: "/flows/books-greek-editor" },
    ],
    "image-services": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("image-services"), path: "/flows/image-services" },
    ],
    image: [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("image-services"), path: "/flows/image-services" },
      { label: toRouteLabel("image"), path: "/flows/image" },
    ],
    "image-convert": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("image-services"), path: "/flows/image-services" },
      { label: toRouteLabel("image-convert"), path: "/flows/image-convert" },
    ],
    "json-services": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("json-services"), path: "/flows/json" },
    ],
    "json-tool": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("json-services"), path: "/flows/json" },
      { label: toRouteLabel("json-tool"), path: currentPath.value },
    ],
    contract: [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("contract"), path: "/contract/openapi" },
    ],
    dashboard: [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("dashboard"), path: "/dashboard" },
    ],
    "admin-tokens": [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("admin-tokens"), path: "/admin/tokens" },
    ],
    donate: [
      { label: toRouteLabel("home"), path: "/" },
      { label: toRouteLabel("donate"), path: "/donate" },
    ],
  };

  return byName[activeRouteName.value] || [{ label: toRouteLabel("home"), path: "/" }];
});

const onNavigate = (path, event) => {
  event.preventDefault();
  router.navigate(path);
};

const openDashboard = () => {
  router.navigate("/dashboard");
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
            <p class="hero__badge">{{ i18n.t("app.badge") }}</p>
            <h1 class="hero__title">{{ pageTitle }}</h1>
          </div>
          <div class="portal-header__meta">
            <p class="hero__status" :class="isHealthy ? 'hero__status--ok' : 'hero__status--down'">
              {{ i18n.t("app.guardStatus") }}: {{ statusLabel }}
              <span v-if="lastCheckedAt">
                · {{ i18n.t("app.timeNow", { time: i18n.formatTime(lastCheckedAt) }) }}
              </span>
            </p>
            <p v-if="hasResolvedPlan" class="hero__status">
              Plan: {{ currentPlanType === "token" ? "Token" : "Free" }}
            </p>
            <button
              v-if="currentPlanType === 'token'"
              type="button"
              class="button button--secondary"
              @click="openDashboard"
            >
              {{ i18n.t("routes.dashboard", {}, "Dashboard") }}
            </button>
            <div class="language-toggle" :aria-label="i18n.t('app.languageLabel')">
              <div
                class="language-segmented"
                role="group"
                :aria-label="i18n.t('app.languageLabel')"
              >
                <button
                  type="button"
                  class="language-segmented__item"
                  :class="{ 'language-segmented__item--active': i18n.locale === 'en' }"
                  :aria-pressed="i18n.locale === 'en'"
                  @click="setLocale('en')"
                >
                  {{ i18n.t("languages.en") }}
                </button>
                <button
                  type="button"
                  class="language-segmented__item"
                  :class="{ 'language-segmented__item--active': i18n.locale === 'el' }"
                  :aria-pressed="i18n.locale === 'el'"
                  @click="setLocale('el')"
                >
                  {{ i18n.t("languages.el") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="portal-header__row">
          <nav class="top-nav" :aria-label="i18n.t('app.navigation')">
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
              {{ toRouteLabel(route.name) }}
            </a>
          </nav>
        </div>
      </div>
    </header>

    <main class="portal-page route-shell">
      <nav class="breadcrumb" :aria-label="i18n.t('app.breadcrumb')">
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
        <p class="guard-overlay__title">{{ i18n.t("app.guardDownTitle") }}</p>
        <p class="guard-overlay__text">
          {{ i18n.t("app.guardDownText", { apiBaseUrl }) }}
        </p>
        <p class="guard-overlay__text">
          {{ i18n.t("app.requestReference") }}:
          <code>{{ requestId || i18n.t("app.notAvailable") }}</code>
        </p>
        <p v-if="error" class="guard-overlay__text">{{ error }}</p>
        <p v-else class="guard-overlay__text">{{ message }}</p>
      </div>
    </div>
  </div>
</template>
