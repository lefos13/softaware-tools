<script setup lang="ts">
/*
  Dashboard keeps all existing data bindings but removes non-functional chrome
  and uses translated in-page submenu sections for focused view switching.
*/
import { computed, inject, onMounted, ref, watch } from "vue";
import AccessHistoryTable from "../components/access/AccessHistoryTable.vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessDashboard } from "../services/accessPlanService";
import type { AccessHistorySortDirection, AccessHistorySortKey } from "../types/services";
import type { PortalAccessStore, PortalContext, PortalI18n, ServiceKey } from "../types/shared";
import { portalAccessKey, portalContextKey } from "../types/shared";
import type { AccessDashboardResult } from "../types/services";

const portalContext = inject(portalContextKey) as PortalContext | undefined;
const portalAccess = inject(portalAccessKey) as PortalAccessStore | undefined;
const { locale, t } = usePortalI18n() as PortalI18n;

if (!portalContext || !portalAccess) {
  throw new Error("Portal context is not available.");
}

const loading = ref(false);
const error = ref("");
const dashboard = ref<AccessDashboardResult | null>(null);
const selectedService = ref("");
const selectedStatus = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const sortBy = ref<AccessHistorySortKey>("createdAt");
const sortDirection = ref<AccessHistorySortDirection>("desc");
type DashboardSection = "history" | "usage" | "summary";
/*
  Sidebar entries switch visible dashboard sections in-page so users stay on
  one route while focusing on history, usage, or token summary details.
*/
const activeSection = ref<DashboardSection>("history");
const setActiveSection = (section: DashboardSection): void => {
  activeSection.value = section;
};

const loadDashboard = async (): Promise<void> => {
  if (portalAccess?.planType?.value !== "token" || !portalAccess?.activeToken?.value) {
    dashboard.value = null;
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    dashboard.value = await fetchAccessDashboard(
      portalContext.apiBaseUrl.value,
      portalAccess.activeToken.value,
      {
        page: currentPage.value,
        limit: pageSize.value,
        serviceKey: selectedService.value as ServiceKey,
        status: selectedStatus.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
      }
    );
  } catch (caughtError) {
    error.value =
      caughtError instanceof Error ? caughtError.message : t("accessDashboard.errors.loadFailed");
  } finally {
    loading.value = false;
  }
};

const formatQuota = (
  serviceItem: NonNullable<AccessDashboardResult["services"]>[number]
): string => {
  const requests = serviceItem?.quota?.requests;
  const words = serviceItem?.quota?.words;
  const parts = [];

  if (requests && requests.limit !== null) {
    parts.push(
      t("accessDashboard.quota.requests", {
        remaining: requests.remaining,
        limit: requests.limit,
      })
    );
  }

  if (words && words.limit !== null) {
    parts.push(
      t("accessDashboard.quota.words", {
        remaining: words.remaining,
        limit: words.limit,
      })
    );
  }

  if (parts.length === 0) {
    return t("accessDashboard.unlimited");
  }

  return parts.join(" · ");
};

const services = computed(() => dashboard.value?.services || []);
const serviceOptions = computed(() => services.value.map((service) => String(service.serviceKey)));
const history = computed(() => dashboard.value?.history || null);
const historyItems = computed(() => history.value?.items || []);
const totalHistoryItems = computed(() => Number(history.value?.total || 0));
const enabledServiceFlags = computed(
  () => dashboard.value?.token?.serviceFlags || portalAccess.plan.value?.token?.serviceFlags || []
);
const selectedTokenAlias = computed(
  () =>
    dashboard.value?.token?.alias ||
    portalAccess.plan.value?.token?.alias ||
    t("accessDashboard.notAvailable")
);
const selectedTokenExpiry = computed(() =>
  formatDateTime(
    dashboard.value?.token?.expiresAt || portalAccess.plan.value?.token?.expiresAt || ""
  )
);
const successfulEvents = computed(
  () =>
    historyItems.value.filter((item) => String(item.status || "").toLowerCase() === "success")
      .length
);
const failedEvents = computed(() =>
  Math.max(0, historyItems.value.length - successfulEvents.value)
);
const successRate = computed(() => {
  const total = successfulEvents.value + failedEvents.value;
  if (!total) {
    return 0;
  }

  return Math.round((successfulEvents.value / total) * 100);
});
const serviceUsageTotals = computed(() => {
  const rows = services.value.map((service) => {
    const requestsUsed = Number(service?.quota?.requests?.used || 0);
    const wordsUsed = Number(service?.quota?.words?.used || 0);
    return {
      serviceKey: String(service.serviceKey),
      totalUsed: requestsUsed + wordsUsed,
    };
  });

  const fallbackRows = [{ serviceKey: "idle", totalUsed: 1 }];
  const normalizedRows = rows.length ? rows : fallbackRows;
  const total = normalizedRows.reduce((sum, row) => sum + Math.max(0, row.totalUsed), 0) || 1;
  let accumulated = 0;

  return normalizedRows.map((row, index) => {
    const slice = Math.max(0, row.totalUsed);
    const share = Math.max(3, Math.round((slice / total) * 100));
    const adjustedShare =
      index === normalizedRows.length - 1 ? Math.max(1, 100 - accumulated) : share;
    accumulated += adjustedShare;
    return {
      label: row.serviceKey,
      share: adjustedShare,
    };
  });
});
const serviceUsageGradient = computed(() => {
  const colors = ["#16a085", "#3da5d9", "#566573", "#e67e22", "#7f8c8d"];
  let start = 0;

  return serviceUsageTotals.value
    .map((segment, index) => {
      const end = Math.min(100, start + segment.share);
      const color = colors[index % colors.length];
      const stop = `${color} ${start}% ${end}%`;
      start = end;
      return stop;
    })
    .join(", ");
});

const formatDateTime = (value?: string, fallbackKey = "accessDashboard.notAvailable"): string =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const formatServiceFlags = (flags?: string[]): string => {
  const list = Array.isArray(flags) ? flags.filter(Boolean) : [];
  return list.length ? list.join(", ") : t("accessDashboard.notAvailable");
};

watch([selectedService, selectedStatus], () => {
  currentPage.value = 1;
});

watch(
  () => [
    portalAccess?.planType?.value,
    portalAccess?.activeToken?.value,
    selectedService.value,
    selectedStatus.value,
    currentPage.value,
    pageSize.value,
    sortBy.value,
    sortDirection.value,
  ],
  () => {
    void loadDashboard();
  }
);

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <section class="dashboard-v2">
    <div class="dashboard-v2__topbar">
      <p class="dashboard-v2__brand">SOFTAWARE</p>
    </div>

    <div class="dashboard-v2__body">
      <aside class="dashboard-v2__sidenav">
        <p class="dashboard-v2__nav-label">{{ t("accessDashboard.submenu.title") }}</p>
        <button
          type="button"
          class="dashboard-v2__nav-link dashboard-v2__nav-btn"
          :class="{ 'dashboard-v2__nav-link--active': activeSection === 'history' }"
          aria-controls="dashboard-section-history"
          :aria-expanded="activeSection === 'history'"
          @click="setActiveSection('history')"
        >
          {{ t("accessDashboard.submenu.history") }}
        </button>
        <button
          type="button"
          class="dashboard-v2__nav-link dashboard-v2__nav-btn"
          :class="{ 'dashboard-v2__nav-link--active': activeSection === 'usage' }"
          aria-controls="dashboard-section-usage"
          :aria-expanded="activeSection === 'usage'"
          @click="setActiveSection('usage')"
        >
          {{ t("accessDashboard.submenu.usage") }}
        </button>
        <button
          type="button"
          class="dashboard-v2__nav-link dashboard-v2__nav-btn"
          :class="{ 'dashboard-v2__nav-link--active': activeSection === 'summary' }"
          aria-controls="dashboard-section-summary"
          :aria-expanded="activeSection === 'summary'"
          @click="setActiveSection('summary')"
        >
          {{ t("accessDashboard.submenu.summary") }}
        </button>
      </aside>

      <main class="dashboard-v2__content">
        <header class="dashboard-v2__header">
          <div class="section-head">
            <h2 class="section-head__title">{{ t("accessDashboard.title") }}</h2>
            <p class="section-head__subtitle">{{ t("accessDashboard.subtitle") }}</p>
          </div>
        </header>

        <div v-if="portalAccess?.planType?.value !== 'token'" class="tool-card">
          <p class="tool-card__description">
            {{ t("accessDashboard.tokenOnlyMessage") }}
          </p>
        </div>

        <div v-else class="dashboard-v2__canvas">
          <section
            v-show="activeSection === 'history'"
            id="dashboard-section-history"
            class="dashboard-v2__panel dashboard-v2__section"
            :class="{ 'dashboard-v2__section--hidden': activeSection !== 'history' }"
          >
            <div class="dashboard-v2__panel-head">
              <h3 class="merge-step__title">{{ t("accessDashboard.submenu.history") }}</h3>
            </div>
            <AccessHistoryTable
              :loading="loading"
              :error="error"
              :items="historyItems"
              :service-options="serviceOptions"
              :selected-service="selectedService"
              :selected-status="selectedStatus"
              :page="currentPage"
              :page-size="pageSize"
              :total-items="totalHistoryItems"
              :sort-by="sortBy"
              :sort-direction="sortDirection"
              :loading-message="t('accessDashboard.loading')"
              :empty-message="t('accessDashboard.empty')"
              @update:selected-service="selectedService = $event"
              @update:selected-status="selectedStatus = $event"
              @update:page-size="pageSize = $event"
              @update:page="currentPage = $event"
              @update:sort-by="sortBy = $event"
              @update:sort-direction="sortDirection = $event"
            />
          </section>

          <section
            v-show="activeSection === 'usage'"
            id="dashboard-section-usage"
            class="dashboard-v2__panel dashboard-v2__section"
            :class="{ 'dashboard-v2__section--hidden': activeSection !== 'usage' }"
          >
            <div class="dashboard-v2__panel-head">
              <h3 class="merge-step__title">{{ t("accessDashboard.submenu.usage") }}</h3>
            </div>
            <div class="dashboard-v2__usage-list">
              <article
                v-for="service in services"
                :key="service.serviceKey"
                class="dashboard-v2__usage-item"
              >
                <strong>{{ service.serviceKey }}</strong>
                <span>{{ formatQuota(service) }}</span>
              </article>
            </div>
            <div class="dashboard-v2__donut-block">
              <p class="dashboard-v2__donut-title">{{ t("accessDashboard.usageMixTitle") }}</p>
              <div
                class="dashboard-v2__donut"
                :style="{ '--usage-gradient': serviceUsageGradient }"
                aria-hidden="true"
              ></div>
              <div class="dashboard-v2__legend">
                <p v-for="segment in serviceUsageTotals" :key="segment.label">
                  <strong>{{ segment.label }}</strong
                  >: {{ segment.share }}%
                </p>
              </div>
            </div>
          </section>

          <section
            v-show="activeSection === 'summary'"
            id="dashboard-section-summary"
            class="dashboard-v2__panel dashboard-v2__section"
            :class="{ 'dashboard-v2__section--hidden': activeSection !== 'summary' }"
          >
            <div class="dashboard-v2__panel-head">
              <h3 class="merge-step__title">{{ t("accessDashboard.submenu.summary") }}</h3>
            </div>
            <div class="dashboard-v2__kpi-grid">
              <article class="dashboard-v2__kpi-card">
                <p class="dashboard-v2__kpi-title">{{ t("accessDashboard.overviewTitle") }}</p>
                <p class="dashboard-v2__kpi-value">{{ selectedTokenAlias }}</p>
                <p class="dashboard-v2__kpi-foot">
                  {{ t("accessDashboard.expires") }}: {{ selectedTokenExpiry }}
                </p>
              </article>
              <article class="dashboard-v2__kpi-card">
                <p class="dashboard-v2__kpi-title">{{ t("accessDashboard.enabledServices") }}</p>
                <p class="dashboard-v2__kpi-value">{{ enabledServiceFlags.length }}</p>
                <p class="dashboard-v2__kpi-foot">{{ formatServiceFlags(enabledServiceFlags) }}</p>
              </article>
              <article class="dashboard-v2__kpi-card">
                <p class="dashboard-v2__kpi-title">{{ t("accessDashboard.recentActivity") }}</p>
                <p class="dashboard-v2__kpi-value">{{ totalHistoryItems }}</p>
                <p class="dashboard-v2__kpi-foot">
                  {{ successfulEvents }} success | {{ failedEvents }} failed
                </p>
              </article>
              <article class="dashboard-v2__kpi-card">
                <p class="dashboard-v2__kpi-title">{{ t("accessDashboard.successRate") }}</p>
                <p class="dashboard-v2__kpi-value">{{ successRate }}%</p>
                <p class="dashboard-v2__kpi-foot">{{ t("accessDashboard.successRateSubtitle") }}</p>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  </section>
</template>

<style src="./AccessDashboardView.scss" lang="scss"></style>
