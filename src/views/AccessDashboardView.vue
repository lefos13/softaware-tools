<script setup lang="ts">
/*
  The owner dashboard combines token status, remaining service usage, and the
  recent action log on one route so token holders have a single self-serve hub.
*/
import { computed, inject, onMounted, ref, watch } from "vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessDashboard } from "../services/accessPlanService";
import type { PortalAccessStore, PortalContext, PortalI18n, ServiceKey } from "../types/shared";
import { portalAccessKey, portalContextKey } from "../types/shared";
import type { AccessDashboardHistoryRow, AccessDashboardResult } from "../types/services";

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
const sortBy = ref("createdAt");
const sortDirection = ref("desc");

/*
  History is now rendered as a sortable and paginated usage table, so every
  dashboard reload carries filter, sort, and paging state to the backend.
*/
const historySortColumns = [
  "createdAt",
  "operationName",
  "serviceKey",
  "status",
  "consumedRequests",
  "consumedWords",
] as const;

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
const history = computed(() => dashboard.value?.history || null);
const historyItems = computed<AccessDashboardHistoryRow[]>(() => history.value?.items || []);
const totalHistoryItems = computed(() => Number(history.value?.total || 0));
const totalPages = computed(() => Math.max(1, Math.ceil(totalHistoryItems.value / pageSize.value)));
const canGoPrev = computed(() => currentPage.value > 1);
const canGoNext = computed(() => currentPage.value < totalPages.value);

const formatDateTime = (value?: string, fallbackKey = "accessDashboard.notAvailable"): string =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const formatNumber = (value?: number | string): string =>
  new Intl.NumberFormat(locale.value === "el" ? "el-GR" : "en-US").format(Number(value || 0));

const formatStatus = (value?: string): string =>
  value === "success" ? t("accessDashboard.status.success") : t("accessDashboard.status.failed");

const formatServiceFlags = (flags?: string[]): string => {
  const list = Array.isArray(flags) ? flags.filter(Boolean) : [];
  return list.length ? list.join(", ") : t("accessDashboard.notAvailable");
};

const toggleSort = (columnKey: (typeof historySortColumns)[number]): void => {
  if (!historySortColumns.includes(columnKey)) {
    return;
  }

  if (sortBy.value === columnKey) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = columnKey;
    sortDirection.value = columnKey === "createdAt" ? "desc" : "asc";
  }

  currentPage.value = 1;
};

const sortIndicator = (columnKey: (typeof historySortColumns)[number]): string => {
  if (sortBy.value !== columnKey) {
    return "";
  }
  return sortDirection.value === "asc" ? "▲" : "▼";
};

const goToPage = (nextPage: number): void => {
  const boundedPage = Math.min(totalPages.value, Math.max(1, Number(nextPage) || 1));
  if (boundedPage === currentPage.value) {
    return;
  }
  currentPage.value = boundedPage;
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
          <div class="dashboard-history__filters">
            <select v-model="selectedService" class="rotation-select">
              <option value="">{{ t("accessDashboard.filters.allServices") }}</option>
              <option
                v-for="service in services"
                :key="service.serviceKey"
                :value="service.serviceKey"
              >
                {{ service.serviceKey }}
              </option>
            </select>
            <select v-model="selectedStatus" class="rotation-select">
              <option value="">{{ t("accessDashboard.filters.allStatuses") }}</option>
              <option value="success">{{ t("accessDashboard.status.success") }}</option>
              <option value="failed">{{ t("accessDashboard.status.failed") }}</option>
            </select>
            <select v-model.number="pageSize" class="rotation-select">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <p v-if="loading" class="tool-card__description">
          {{ t("accessDashboard.loading") }}
        </p>
        <p v-else-if="error" class="tool-card__description tool-card__description--error">
          {{ error }}
        </p>
        <div v-else class="dashboard-history__table-wrap">
          <table v-if="historyItems.length" class="dashboard-history__table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('createdAt')"
                  >
                    {{ t("accessDashboard.table.date") }} {{ sortIndicator("createdAt") }}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('operationName')"
                  >
                    {{ t("accessDashboard.table.operation") }} {{ sortIndicator("operationName") }}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('serviceKey')"
                  >
                    {{ t("accessDashboard.table.service") }} {{ sortIndicator("serviceKey") }}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('status')"
                  >
                    {{ t("accessDashboard.table.status") }} {{ sortIndicator("status") }}
                  </button>
                </th>
                <th class="dashboard-history__table-number">
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('consumedRequests')"
                  >
                    {{ t("accessDashboard.table.requests") }}
                    {{ sortIndicator("consumedRequests") }}
                  </button>
                </th>
                <th class="dashboard-history__table-number">
                  <button
                    type="button"
                    class="dashboard-history__sort-btn"
                    @click="toggleSort('consumedWords')"
                  >
                    {{ t("accessDashboard.table.words") }} {{ sortIndicator("consumedWords") }}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in historyItems" :key="item.eventId">
                <td>{{ formatDateTime(item.createdAt) }}</td>
                <td>{{ item.operationName }}</td>
                <td>{{ item.serviceKey }}</td>
                <td>{{ formatStatus(item.status) }}</td>
                <td class="dashboard-history__table-number">
                  {{ formatNumber(item.consumedRequests) }}
                </td>
                <td class="dashboard-history__table-number">
                  {{ formatNumber(item.consumedWords) }}
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="tool-card__description">
            {{ t("accessDashboard.empty") }}
          </p>

          <div v-if="historyItems.length" class="dashboard-history__pagination">
            <button
              type="button"
              class="rotation-select"
              :disabled="!canGoPrev"
              @click="goToPage(currentPage - 1)"
            >
              {{ t("accessDashboard.pagination.previous") }}
            </button>
            <span>
              {{
                t("accessDashboard.pagination.summary", {
                  page: currentPage,
                  totalPages,
                  totalItems: formatNumber(totalHistoryItems),
                })
              }}
            </span>
            <button
              type="button"
              class="rotation-select"
              :disabled="!canGoNext"
              @click="goToPage(currentPage + 1)"
            >
              {{ t("accessDashboard.pagination.next") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style src="./AccessDashboardView.scss" lang="scss"></style>
