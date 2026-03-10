<script setup>
/*
  The owner dashboard combines token status, remaining service usage, and the
  recent action log on one route so token holders have a single self-serve hub.
*/
import { computed, inject, onMounted, ref, watch } from "vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessDashboard } from "../services/accessPlanService";

const portalContext = inject("portalContext");
const portalAccess = inject("portalAccess");
const { locale, t } = usePortalI18n();

const loading = ref(false);
const error = ref("");
const dashboard = ref(null);
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
];

const loadDashboard = async () => {
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
        serviceKey: selectedService.value,
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

const formatQuota = (serviceItem) => {
  const requests = serviceItem?.quota?.requests;
  const words = serviceItem?.quota?.words;
  const parts = [];

  if (requests?.limit !== null) {
    parts.push(
      t("accessDashboard.quota.requests", {
        remaining: requests.remaining,
        limit: requests.limit,
      })
    );
  }

  if (words?.limit !== null) {
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
const historyItems = computed(() => history.value?.items || []);
const totalHistoryItems = computed(() => Number(history.value?.total || 0));
const totalPages = computed(() => Math.max(1, Math.ceil(totalHistoryItems.value / pageSize.value)));
const canGoPrev = computed(() => currentPage.value > 1);
const canGoNext = computed(() => currentPage.value < totalPages.value);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t("accessDashboard.notAvailable");

const formatNumber = (value) =>
  new Intl.NumberFormat(locale.value === "el" ? "el-GR" : "en-US").format(Number(value || 0));

const formatStatus = (value) =>
  value === "success" ? t("accessDashboard.status.success") : t("accessDashboard.status.failed");

const formatServiceFlags = (flags) => {
  const list = Array.isArray(flags) ? flags.filter(Boolean) : [];
  return list.length ? list.join(", ") : t("accessDashboard.notAvailable");
};

const toggleSort = (columnKey) => {
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

const sortIndicator = (columnKey) => {
  if (sortBy.value !== columnKey) {
    return "";
  }
  return sortDirection.value === "asc" ? "▲" : "▼";
};

const goToPage = (nextPage) => {
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
          <strong>{{ dashboard?.token?.alias || portalAccess?.plan?.token?.alias }}</strong>
        </p>
        <p class="tool-card__description dashboard-token-overview__row">
          <span class="dashboard-token-overview__label">{{ t("accessDashboard.expires") }}</span>
          <strong class="dashboard-token-overview__value">
            {{
              formatDateTime(
                dashboard?.token?.expiresAt || portalAccess?.plan?.token?.expiresAt || ""
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
                dashboard?.token?.serviceFlags || portalAccess?.plan?.token?.serviceFlags || []
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

<style scoped>
/*
  The dashboard layout favors compact cards first so token owners can scan
  quota status quickly before dropping into the larger history section.
*/
.dashboard-grid {
  display: grid;
  gap: 1rem;
}

.dashboard-service-list {
  display: grid;
  gap: 0.75rem;
}

.dashboard-service-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
}

.dashboard-token-overview {
  background: linear-gradient(180deg, rgba(240, 249, 255, 0.95), rgba(248, 250, 252, 0.98));
  border-color: rgba(14, 116, 144, 0.2);
}

.dashboard-token-overview__row {
  display: grid;
  gap: 0.25rem;
  margin: 0;
}

.dashboard-token-overview__label {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.dashboard-token-overview__value {
  color: #0f172a;
}

.dashboard-history__head,
.dashboard-history__filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dashboard-history__head {
  justify-content: space-between;
  align-items: center;
}

.dashboard-history__table-wrap {
  display: grid;
  gap: 0.85rem;
}

.dashboard-history__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.dashboard-history__table th,
.dashboard-history__table td {
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  text-align: left;
  vertical-align: middle;
}

.dashboard-history__table-number {
  text-align: right;
}

.dashboard-history__sort-btn {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
  cursor: pointer;
}

.dashboard-history__pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .dashboard-service-item,
  .dashboard-history__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-history__table-wrap {
    overflow-x: auto;
  }
}
</style>
