<script setup lang="ts">
/*
  The owner dashboard combines token status, remaining service usage, and the
  recent action log on one route so token holders have a single self-serve hub.
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
  <section class="flow-view">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("accessDashboard.title") }}</h2>
      <p class="section-head__subtitle">
        {{ t("accessDashboard.subtitle") }}
      </p>
    </div>

    <div v-if="portalAccess?.planType?.value !== 'token'" class="tool-card">
      <p class="tool-card__description">
        {{ t("accessDashboard.tokenOnlyMessage") }}
      </p>
    </div>

    <div v-else class="dashboard-grid">
      <div class="tool-card dashboard-token-overview">
        <p class="merge-step__title">{{ t("accessDashboard.overviewTitle") }}</p>
        <p class="tool-card__description dashboard-token-overview__row">
          <strong>{{ dashboard?.token?.alias || portalAccess.plan.value?.token?.alias }}</strong>
        </p>
        <p class="tool-card__description dashboard-token-overview__row">
          <span class="dashboard-token-overview__label">{{ t("accessDashboard.expires") }}</span>
          <strong class="dashboard-token-overview__value">
            {{
              formatDateTime(
                dashboard?.token?.expiresAt || portalAccess.plan.value?.token?.expiresAt || ""
              )
            }}
          </strong>
        </p>
        <p class="tool-card__description dashboard-token-overview__row">
          <span class="dashboard-token-overview__label">{{
            t("accessDashboard.enabledServices")
          }}</span>
          <strong class="dashboard-token-overview__value">
            {{
              formatServiceFlags(
                dashboard?.token?.serviceFlags || portalAccess.plan.value?.token?.serviceFlags || []
              )
            }}
          </strong>
        </p>
      </div>

      <div class="tool-card">
        <p class="merge-step__title">{{ t("accessDashboard.usageByService") }}</p>
        <div class="dashboard-service-list">
          <article
            v-for="service in services"
            :key="service.serviceKey"
            class="dashboard-service-item"
          >
            <strong>{{ service.serviceKey }}</strong>
            <span>{{ formatQuota(service) }}</span>
          </article>
        </div>
      </div>

      <div class="tool-card dashboard-history">
        <div class="dashboard-history__head">
          <p class="merge-step__title">{{ t("accessDashboard.recentActivity") }}</p>
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
      </div>
    </div>
  </section>
</template>

<style src="./AccessDashboardView.scss" lang="scss"></style>
