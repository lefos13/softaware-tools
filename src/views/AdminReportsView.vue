<script setup>
// Why this exists: admins need a dedicated UI to review backend request-failure reports and inspect full diagnostics.
import { computed, inject, onMounted, ref } from "vue";
import { getFailureReport, listFailureReports } from "../services/adminReportsService";

const portalContext = inject("portalContext");

const loading = ref(false);
const detailLoading = ref(false);
const error = ref("");
const reports = ref([]);
const selectedFileName = ref("");
const selectedReport = ref(null);

const selectedSummary = computed(() => {
  if (!selectedFileName.value) {
    return null;
  }

  return reports.value.find((item) => item.fileName === selectedFileName.value) || null;
});

const loadReports = async () => {
  loading.value = true;
  error.value = "";

  try {
    const data = await listFailureReports(portalContext.apiBaseUrl.value, 120);
    reports.value = Array.isArray(data.reports) ? data.reports : [];

    if (reports.value.length === 0) {
      selectedFileName.value = "";
      selectedReport.value = null;
      return;
    }

    if (
      !selectedFileName.value ||
      !reports.value.some((r) => r.fileName === selectedFileName.value)
    ) {
      selectedFileName.value = reports.value[0].fileName;
      await loadReportDetail(selectedFileName.value);
    }
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "Could not load reports";
  } finally {
    loading.value = false;
  }
};

const loadReportDetail = async (fileName) => {
  if (!fileName) {
    return;
  }

  detailLoading.value = true;
  error.value = "";

  try {
    selectedFileName.value = fileName;
    const detail = await getFailureReport(portalContext.apiBaseUrl.value, fileName);
    selectedReport.value = detail?.report || null;
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "Could not load report details";
  } finally {
    detailLoading.value = false;
  }
};

onMounted(() => {
  void loadReports();
});
</script>

<template>
  <section class="flow-view" aria-label="Admin reports">
    <div class="section-head section-head--spaced admin-head">
      <div>
        <h2 class="section-head__title">Admin Failure Reports</h2>
        <p class="section-head__subtitle">
          Review backend request-failure logs generated for failed API requests.
        </p>
      </div>
      <button
        type="button"
        class="button button--secondary"
        :disabled="loading"
        @click="loadReports"
      >
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>

    <div class="admin-layout">
      <article class="tool-card admin-list">
        <h3 class="tool-card__title">Recent Reports</h3>
        <p class="tool-card__description">Total: {{ reports.length }}</p>

        <p v-if="!loading && reports.length === 0" class="tool-card__description">
          No reports found.
        </p>

        <ul v-else class="report-list" role="list">
          <li v-for="item in reports" :key="item.fileName">
            <button
              type="button"
              class="report-list__item"
              :class="{ 'report-list__item--active': selectedFileName === item.fileName }"
              @click="loadReportDetail(item.fileName)"
            >
              <strong>{{ item.errorCode || "UNKNOWN" }}</strong>
              <span
                >{{ item.statusCode || "-" }} · {{ item.method || "-" }}
                {{ item.path || "-" }}</span
              >
              <span>{{
                item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown time"
              }}</span>
            </button>
          </li>
        </ul>
      </article>

      <article class="tool-card admin-detail">
        <h3 class="tool-card__title">Report Details</h3>
        <p v-if="selectedSummary" class="tool-card__description">
          File: <code>{{ selectedSummary.fileName }}</code>
        </p>
        <p v-if="detailLoading" class="tool-card__description">Loading report details...</p>
        <p v-else-if="!selectedReport" class="tool-card__description">
          Select a report to inspect details.
        </p>
        <pre v-else class="report-json">{{ JSON.stringify(selectedReport, null, 2) }}</pre>
      </article>
    </div>
  </section>
</template>
