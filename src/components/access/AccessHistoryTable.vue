<script setup lang="ts">
/*
  History filters, sorting, and pagination stay in one component so owner and
  superadmin views render the same activity table instead of drifting apart.
*/
import { computed } from "vue";
import { usePortalI18n } from "../../i18n";
import type {
  AccessDashboardHistoryRow,
  AccessHistorySortDirection,
  AccessHistorySortKey,
} from "../../types/services";
import type { PortalI18n } from "../../types/shared";
import { formatAccessServiceLabel } from "../../utils/accessServiceLabels";

const props = withDefaults(
  defineProps<{
    loading: boolean;
    error?: string;
    items?: AccessDashboardHistoryRow[];
    serviceOptions?: string[];
    selectedService?: string;
    selectedStatus?: string;
    page?: number;
    pageSize?: number;
    totalItems?: number;
    sortBy?: AccessHistorySortKey;
    sortDirection?: AccessHistorySortDirection;
    loadingMessage?: string;
    emptyMessage?: string;
  }>(),
  {
    error: "",
    items: () => [],
    serviceOptions: () => [],
    selectedService: "",
    selectedStatus: "",
    page: 1,
    pageSize: 10,
    totalItems: 0,
    sortBy: "createdAt",
    sortDirection: "desc",
    loadingMessage: "",
    emptyMessage: "",
  }
);

const emit = defineEmits<{
  "update:selectedService": [value: string];
  "update:selectedStatus": [value: string];
  "update:pageSize": [value: number];
  "update:page": [value: number];
  "update:sortBy": [value: AccessHistorySortKey];
  "update:sortDirection": [value: AccessHistorySortDirection];
}>();

const { locale, t } = usePortalI18n() as PortalI18n;

const sortableColumns: AccessHistorySortKey[] = [
  "createdAt",
  "operationName",
  "serviceKey",
  "status",
  "consumedRequests",
  "consumedWords",
];

const totalPages = computed(() =>
  Math.max(1, Math.ceil(Number(props.totalItems || 0) / Math.max(1, Number(props.pageSize || 10))))
);
const canGoPrev = computed(() => Number(props.page || 1) > 1);
const canGoNext = computed(() => Number(props.page || 1) < totalPages.value);

const formatDateTime = (value?: string, fallbackKey = "accessDashboard.notAvailable"): string =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const formatNumber = (value?: number | string): string =>
  new Intl.NumberFormat(locale.value === "el" ? "el-GR" : "en-US").format(Number(value || 0));

const formatStatus = (value?: string): string =>
  value === "success" ? t("accessDashboard.status.success") : t("accessDashboard.status.failed");

const formatServiceLabel = (serviceKey?: string): string =>
  formatAccessServiceLabel(t, serviceKey) || t("accessDashboard.notAvailable");

const toggleSort = (columnKey: AccessHistorySortKey): void => {
  if (!sortableColumns.includes(columnKey)) {
    return;
  }

  if (props.sortBy === columnKey) {
    emit("update:sortDirection", props.sortDirection === "asc" ? "desc" : "asc");
  } else {
    emit("update:sortBy", columnKey);
    emit("update:sortDirection", columnKey === "createdAt" ? "desc" : "asc");
  }

  emit("update:page", 1);
};

const sortIndicator = (columnKey: AccessHistorySortKey): string => {
  if (props.sortBy !== columnKey) {
    return "";
  }

  return props.sortDirection === "asc" ? "▲" : "▼";
};

const updatePageSize = (value: string): void => {
  emit("update:pageSize", Math.max(1, Number(value) || 10));
  emit("update:page", 1);
};

const updateSelectedService = (event: Event): void => {
  emit("update:selectedService", String((event.target as HTMLSelectElement)?.value || ""));
};

const updateSelectedStatus = (event: Event): void => {
  emit("update:selectedStatus", String((event.target as HTMLSelectElement)?.value || ""));
};

const updatePageSizeFromEvent = (event: Event): void => {
  updatePageSize(String((event.target as HTMLSelectElement)?.value || "10"));
};

const goToPage = (nextPage: number): void => {
  const boundedPage = Math.min(totalPages.value, Math.max(1, Number(nextPage) || 1));
  if (boundedPage === props.page) {
    return;
  }

  emit("update:page", boundedPage);
};
</script>

<template>
  <div class="access-history">
    <div class="access-history__filters">
      <select :value="selectedService" class="rotation-select" @change="updateSelectedService">
        <option value="">{{ t("accessDashboard.filters.allServices") }}</option>
        <option v-for="serviceKey in serviceOptions" :key="serviceKey" :value="serviceKey">
          {{ formatServiceLabel(serviceKey) }}
        </option>
      </select>
      <select :value="selectedStatus" class="rotation-select" @change="updateSelectedStatus">
        <option value="">{{ t("accessDashboard.filters.allStatuses") }}</option>
        <option value="success">{{ t("accessDashboard.status.success") }}</option>
        <option value="failed">{{ t("accessDashboard.status.failed") }}</option>
      </select>
      <select :value="String(pageSize)" class="rotation-select" @change="updatePageSizeFromEvent">
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>

    <p v-if="loading" class="tool-card__description">
      {{ loadingMessage || t("accessDashboard.loading") }}
    </p>
    <p v-else-if="error" class="tool-card__description tool-card__description--error">
      {{ error }}
    </p>
    <div v-else class="access-history__table-wrap">
      <table v-if="items.length" class="access-history__table">
        <thead>
          <tr>
            <th>
              <button
                type="button"
                class="access-history__sort-btn"
                @click="toggleSort('createdAt')"
              >
                {{ t("accessDashboard.table.date") }} {{ sortIndicator("createdAt") }}
              </button>
            </th>
            <th>
              <button
                type="button"
                class="access-history__sort-btn"
                @click="toggleSort('operationName')"
              >
                {{ t("accessDashboard.table.operation") }} {{ sortIndicator("operationName") }}
              </button>
            </th>
            <th>
              <button
                type="button"
                class="access-history__sort-btn"
                @click="toggleSort('serviceKey')"
              >
                {{ t("accessDashboard.table.service") }} {{ sortIndicator("serviceKey") }}
              </button>
            </th>
            <th>
              <button type="button" class="access-history__sort-btn" @click="toggleSort('status')">
                {{ t("accessDashboard.table.status") }} {{ sortIndicator("status") }}
              </button>
            </th>
            <th class="access-history__table-number">
              <button
                type="button"
                class="access-history__sort-btn"
                @click="toggleSort('consumedRequests')"
              >
                {{ t("accessDashboard.table.requests") }}
                {{ sortIndicator("consumedRequests") }}
              </button>
            </th>
            <th class="access-history__table-number">
              <button
                type="button"
                class="access-history__sort-btn"
                @click="toggleSort('consumedWords')"
              >
                {{ t("accessDashboard.table.words") }} {{ sortIndicator("consumedWords") }}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.eventId || item.createdAt || item.operationName">
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>{{ item.operationName || t("accessDashboard.notAvailable") }}</td>
            <td>{{ formatServiceLabel(item.serviceKey) }}</td>
            <td>{{ formatStatus(item.status) }}</td>
            <td class="access-history__table-number">
              {{ formatNumber(item.consumedRequests) }}
            </td>
            <td class="access-history__table-number">
              {{ formatNumber(item.consumedWords) }}
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="tool-card__description">
        {{ emptyMessage || t("accessDashboard.empty") }}
      </p>

      <div v-if="items.length" class="access-history__pagination">
        <button
          type="button"
          class="rotation-select"
          :disabled="!canGoPrev"
          @click="goToPage(Number(page) - 1)"
        >
          {{ t("accessDashboard.pagination.previous") }}
        </button>
        <span>
          {{
            t("accessDashboard.pagination.summary", {
              page,
              totalPages,
              totalItems: formatNumber(totalItems),
            })
          }}
        </span>
        <button
          type="button"
          class="rotation-select"
          :disabled="!canGoNext"
          @click="goToPage(Number(page) + 1)"
        >
          {{ t("accessDashboard.pagination.next") }}
        </button>
      </div>
    </div>
  </div>
</template>

<style src="./AccessHistoryTable.scss" lang="scss"></style>
