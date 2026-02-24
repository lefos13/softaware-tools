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
const reportViewMode = ref("pretty");

const selectedSummary = computed(() => {
  if (!selectedFileName.value) {
    return null;
  }

  return reports.value.find((item) => item.fileName === selectedFileName.value) || null;
});

// Added so admins can switch between a structured readable report view and raw JSON quickly.
const safeStringify = (value) => {
  if (value === undefined) {
    return "";
  }

  return JSON.stringify(value, null, 2);
};

const formattedReportRaw = computed(() =>
  selectedReport.value ? JSON.stringify(selectedReport.value, null, 2) : ""
);

const operationIntentEntries = computed(() => {
  const intent = selectedReport.value?.operation?.intent;
  if (!intent || typeof intent !== "object") {
    return [];
  }

  return Object.entries(intent);
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
        <div v-if="selectedReport" class="preview-card__actions">
          <button
            type="button"
            class="button button--secondary"
            :disabled="reportViewMode === 'pretty'"
            @click="reportViewMode = 'pretty'"
          >
            Pretty
          </button>
          <button
            type="button"
            class="button button--secondary"
            :disabled="reportViewMode === 'raw'"
            @click="reportViewMode = 'raw'"
          >
            Raw
          </button>
        </div>
        <p v-if="detailLoading" class="tool-card__description">Loading report details...</p>
        <p v-else-if="!selectedReport" class="tool-card__description">
          Select a report to inspect details.
        </p>
        <template v-else>
          <div v-if="reportViewMode === 'pretty'" class="pretty-report">
            <section class="pretty-report__section">
              <h4 class="pretty-report__title">Summary</h4>
              <div class="pretty-grid">
                <p>
                  <strong>Request ID:</strong> <code>{{ selectedReport.requestId || "n/a" }}</code>
                </p>
                <p>
                  <strong>Task ID:</strong> <code>{{ selectedReport.taskId || "n/a" }}</code>
                </p>
                <p>
                  <strong>Created:</strong>
                  {{
                    selectedReport.createdAt
                      ? new Date(selectedReport.createdAt).toLocaleString()
                      : "n/a"
                  }}
                </p>
                <p><strong>Type:</strong> {{ selectedReport.reportType || "request-failure" }}</p>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">Operation</h4>
              <div class="pretty-grid">
                <p>
                  <strong>Method:</strong>
                  <code>{{ selectedReport.operation?.method || "n/a" }}</code>
                </p>
                <p>
                  <strong>Path:</strong> <code>{{ selectedReport.operation?.path || "n/a" }}</code>
                </p>
              </div>
              <div v-if="operationIntentEntries.length > 0" class="pretty-subsection">
                <p class="pretty-subsection__title">Intent</p>
                <ul class="pretty-list">
                  <li v-for="[key, value] in operationIntentEntries" :key="key">
                    <strong>{{ key }}:</strong>
                    <code>{{ typeof value === "string" ? value : safeStringify(value) }}</code>
                  </li>
                </ul>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">Failure</h4>
              <div class="pretty-grid">
                <p><strong>Status:</strong> {{ selectedReport.failure?.statusCode ?? "n/a" }}</p>
                <p>
                  <strong>Code:</strong> <code>{{ selectedReport.failure?.code || "n/a" }}</code>
                </p>
              </div>
              <p class="pretty-message">{{ selectedReport.failure?.message || "n/a" }}</p>
              <div v-if="selectedReport.failure?.details?.length" class="pretty-subsection">
                <p class="pretty-subsection__title">Details</p>
                <ul class="pretty-list">
                  <li v-for="(detail, index) in selectedReport.failure.details" :key="index">
                    <strong>{{ detail.field || "field" }}:</strong>
                    {{ detail.issue || "Invalid value" }}
                  </li>
                </ul>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">Request Context</h4>
              <div class="pretty-grid">
                <p>
                  <strong>IP:</strong> <code>{{ selectedReport.requestContext?.ip || "n/a" }}</code>
                </p>
                <p>
                  <strong>User Agent:</strong>
                  <span class="pretty-wrap">{{
                    selectedReport.requestContext?.userAgent || "n/a"
                  }}</span>
                </p>
              </div>
              <div class="pretty-subsection">
                <p class="pretty-subsection__title">Query</p>
                <pre class="report-json report-json--nested">{{
                  safeStringify(selectedReport.requestContext?.query || {})
                }}</pre>
              </div>
              <div class="pretty-subsection">
                <p class="pretty-subsection__title">Body</p>
                <pre class="report-json report-json--nested">{{
                  safeStringify(selectedReport.requestContext?.body || {})
                }}</pre>
              </div>
              <div class="pretty-subsection">
                <p class="pretty-subsection__title">Uploaded Files</p>
                <pre class="report-json report-json--nested">{{
                  safeStringify(selectedReport.requestContext?.uploadedFiles || [])
                }}</pre>
              </div>
            </section>
          </div>
          <pre v-else class="report-json">{{ formattedReportRaw }}</pre>
        </template>
      </article>
    </div>
  </section>
</template>
