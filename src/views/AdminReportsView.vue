<script setup>
/*
  Token-gated admin reporting keeps the screen hidden from public browsing and
  only reveals superadmin controls when the validated token role allows it.
*/
import { computed, inject, ref } from "vue";
import {
  getFailureReport,
  invalidateAllAdminTokens,
  listAdminTokens,
  listFailureReports,
  revokeAdminTokens,
} from "../services/adminReportsService";

const portalContext = inject("portalContext");
const TOKEN_STORAGE_KEY = "admin_reports_token";

const loading = ref(false);
const detailLoading = ref(false);
const tokenLoading = ref(false);
const invalidateLoading = ref(false);
const tokenCatalogLoading = ref(false);
const revokeSelectedLoading = ref(false);
const error = ref("");
const reports = ref([]);
const adminTokens = ref([]);
const selectedTokenIds = ref([]);
const currentAdminTokenId = ref("");
const selectedFileName = ref("");
const selectedReport = ref(null);
const reportViewMode = ref("pretty");
const tokenInput = ref(sessionStorage.getItem(TOKEN_STORAGE_KEY) || "");
const activeToken = ref(sessionStorage.getItem(TOKEN_STORAGE_KEY) || "");
const viewerRole = ref("");
const viewerOwnerId = ref("");

const isAuthenticated = computed(() => Boolean(activeToken.value));
const isSuperAdmin = computed(() => viewerRole.value === "superadmin");
const selectedTokenCount = computed(() => selectedTokenIds.value.length);

const selectedSummary = computed(() => {
  if (!selectedFileName.value) {
    return null;
  }

  return reports.value.find((item) => item.fileName === selectedFileName.value) || null;
});

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
  const intent = selectedReport.value?.operation;
  if (!intent || typeof intent !== "object") {
    return [];
  }

  return Object.entries(intent);
});

const resetReportsState = () => {
  reports.value = [];
  adminTokens.value = [];
  selectedTokenIds.value = [];
  currentAdminTokenId.value = "";
  selectedFileName.value = "";
  selectedReport.value = null;
  viewerRole.value = "";
  viewerOwnerId.value = "";
};

/*
  Superadmin token inventory is refreshed independently so token management
  does not block the report browsing flow or require a full screen reload.
*/
const loadAdminTokenCatalog = async () => {
  if (!activeToken.value || !isSuperAdmin.value) {
    adminTokens.value = [];
    selectedTokenIds.value = [];
    currentAdminTokenId.value = "";
    return;
  }

  tokenCatalogLoading.value = true;

  try {
    const data = await listAdminTokens(portalContext.apiBaseUrl.value, activeToken.value);
    const nextTokens = Array.isArray(data.tokens) ? data.tokens : [];
    const availableIds = new Set(nextTokens.map((tokenItem) => tokenItem.tokenId));
    adminTokens.value = nextTokens;
    currentAdminTokenId.value = data.currentTokenId || "";
    selectedTokenIds.value = selectedTokenIds.value.filter((tokenId) => availableIds.has(tokenId));
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : "Could not load admin token inventory";
  } finally {
    tokenCatalogLoading.value = false;
  }
};

const loadReportDetail = async (fileName) => {
  if (!fileName || !activeToken.value) {
    return;
  }

  detailLoading.value = true;
  error.value = "";

  try {
    selectedFileName.value = fileName;
    const detail = await getFailureReport(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      fileName
    );
    selectedReport.value = detail?.report || null;
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : "Could not load report details";
  } finally {
    detailLoading.value = false;
  }
};

const loadReports = async () => {
  if (!activeToken.value) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const data = await listFailureReports(portalContext.apiBaseUrl.value, activeToken.value, 120);
    reports.value = Array.isArray(data.reports) ? data.reports : [];
    viewerRole.value = data.viewerRole || "";
    viewerOwnerId.value = data.viewerOwnerId || "";

    if (data.viewerRole === "superadmin") {
      await loadAdminTokenCatalog();
    } else {
      adminTokens.value = [];
      selectedTokenIds.value = [];
      currentAdminTokenId.value = "";
    }

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
    resetReportsState();
  } finally {
    loading.value = false;
  }
};

const authenticate = async () => {
  tokenLoading.value = true;
  error.value = "";

  try {
    const nextToken = tokenInput.value.trim();
    if (!nextToken) {
      error.value = "Enter an admin token.";
      return;
    }

    activeToken.value = nextToken;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    await loadReports();
  } catch (authError) {
    error.value = authError instanceof Error ? authError.message : "Could not validate token";
    activeToken.value = "";
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } finally {
    tokenLoading.value = false;
  }
};

const clearToken = () => {
  activeToken.value = "";
  tokenInput.value = "";
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  resetReportsState();
  error.value = "";
};

const runInvalidateAll = async () => {
  if (!isSuperAdmin.value || !activeToken.value) {
    return;
  }

  const accepted = window.confirm(
    "Invalidate all admin and superadmin tokens now? This will also revoke your current token."
  );
  if (!accepted) {
    return;
  }

  invalidateLoading.value = true;
  error.value = "";

  try {
    await invalidateAllAdminTokens(portalContext.apiBaseUrl.value, activeToken.value);
    clearToken();
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Could not invalidate tokens";
  } finally {
    invalidateLoading.value = false;
  }
};

const runRevokeSelected = async () => {
  if (!isSuperAdmin.value || !activeToken.value || selectedTokenIds.value.length === 0) {
    return;
  }

  const accepted = window.confirm(
    `Revoke ${selectedTokenIds.value.length} selected token(s)? This can include your current session.`
  );
  if (!accepted) {
    return;
  }

  revokeSelectedLoading.value = true;
  error.value = "";

  try {
    const result = await revokeAdminTokens(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      selectedTokenIds.value
    );

    if (result?.revokedCurrentToken) {
      clearToken();
      return;
    }

    selectedTokenIds.value = [];
    await loadAdminTokenCatalog();
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : "Could not revoke selected tokens";
  } finally {
    revokeSelectedLoading.value = false;
  }
};

if (activeToken.value) {
  void loadReports();
}
</script>

<template>
  <section class="flow-view" aria-label="Admin reports">
    <div class="section-head section-head--spaced admin-head">
      <div>
        <p class="admin-kicker">Restricted Area</p>
        <h2 class="section-head__title">Admin Failure Reports</h2>
        <p class="section-head__subtitle">
          Enter an admin token to view owner-scoped failure reports.
        </p>
      </div>
      <button
        v-if="isAuthenticated"
        type="button"
        class="button button--secondary"
        :disabled="loading"
        @click="loadReports"
      >
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <article class="tool-card admin-access admin-access--highlight">
      <h3 class="tool-card__title">Access Token</h3>
      <p class="tool-card__description">Use the plaintext token generated by softaware studios.</p>
      <div class="admin-access__row">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          placeholder="Enter admin token"
          autocomplete="off"
        />
        <button
          type="button"
          class="button button--primary"
          :disabled="tokenLoading || loading"
          @click="authenticate"
        >
          {{ tokenLoading ? "Validating..." : "Enter" }}
        </button>
        <button
          v-if="isAuthenticated"
          type="button"
          class="button button--secondary"
          :disabled="tokenLoading || loading || invalidateLoading"
          @click="clearToken"
        >
          Clear
        </button>
      </div>
      <p v-if="isAuthenticated" class="tool-card__description">
        Role: <strong>{{ viewerRole || "unknown" }}</strong> · Scope owner:
        <code>{{ viewerOwnerId || "n/a" }}</code>
      </p>
      <div v-if="isAuthenticated" class="admin-chip-row">
        <span class="admin-chip">Validated session</span>
        <span class="admin-chip">Scoped access active</span>
      </div>
    </article>

    <article v-if="isSuperAdmin" class="tool-card admin-super">
      <h3 class="tool-card__title">Superadmin Controls</h3>
      <p class="tool-card__description">
        Review token sessions, revoke selected tokens, or invalidate all admin/superadmin tokens
        immediately.
      </p>
      <div class="preview-card__actions">
        <button
          type="button"
          class="button button--secondary"
          :disabled="tokenCatalogLoading || revokeSelectedLoading || invalidateLoading"
          @click="loadAdminTokenCatalog"
        >
          {{ tokenCatalogLoading ? "Refreshing tokens..." : "Refresh token inventory" }}
        </button>
        <button
          type="button"
          class="button button--secondary"
          :disabled="
            selectedTokenCount === 0 ||
            tokenCatalogLoading ||
            revokeSelectedLoading ||
            invalidateLoading
          "
          @click="runRevokeSelected"
        >
          {{ revokeSelectedLoading ? "Revoking..." : `Revoke selected (${selectedTokenCount})` }}
        </button>
      </div>
      <div class="admin-token-catalog">
        <p v-if="tokenCatalogLoading" class="tool-card__description">Loading token inventory...</p>
        <p v-else-if="adminTokens.length === 0" class="tool-card__description">
          No admin tokens found.
        </p>
        <ul v-else class="admin-token-list" role="list">
          <li
            v-for="tokenItem in adminTokens"
            :key="tokenItem.tokenId"
            class="admin-token-list__item"
          >
            <label class="admin-token-list__label">
              <input
                v-model="selectedTokenIds"
                type="checkbox"
                :value="tokenItem.tokenId"
                :disabled="invalidateLoading || revokeSelectedLoading"
              />
              <span class="admin-token-list__meta">
                <strong>{{ tokenItem.role }}</strong>
                <span>owner {{ tokenItem.ownerId || "public" }}</span>
                <span>id {{ tokenItem.tokenId }}</span>
                <span>
                  {{
                    tokenItem.expiresAt
                      ? `expires ${new Date(tokenItem.expiresAt).toLocaleString()}`
                      : "no expiry"
                  }}
                </span>
              </span>
            </label>
            <div class="admin-chip-row">
              <span
                v-if="tokenItem.isCurrent || tokenItem.tokenId === currentAdminTokenId"
                class="admin-chip"
              >
                Current session
              </span>
              <span v-if="tokenItem.isActive" class="admin-chip">Active</span>
              <span v-else-if="tokenItem.revokedAt" class="admin-chip">Revoked</span>
              <span v-else-if="tokenItem.isExpired" class="admin-chip">Expired</span>
            </div>
          </li>
        </ul>
      </div>
      <button
        type="button"
        class="button button--secondary"
        :disabled="invalidateLoading || loading || tokenCatalogLoading || revokeSelectedLoading"
        @click="runInvalidateAll"
      >
        {{ invalidateLoading ? "Invalidating..." : "Invalidate all tokens" }}
      </button>
    </article>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>

    <div v-if="isAuthenticated" class="admin-layout">
      <article class="tool-card admin-list">
        <h3 class="tool-card__title">Recent Reports</h3>
        <p class="tool-card__description">Total: {{ reports.length }}</p>

        <p v-if="!loading && reports.length === 0" class="tool-card__description">
          No reports found for this owner scope.
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
                  <strong>Body keys:</strong>
                  {{ (selectedReport.requestContext?.bodyKeys || []).join(", ") || "none" }}
                </p>
                <p>
                  <strong>Query keys:</strong>
                  {{ (selectedReport.requestContext?.queryKeys || []).join(", ") || "none" }}
                </p>
              </div>
              <div class="pretty-grid">
                <p>
                  <strong>Uploaded files:</strong>
                  {{ selectedReport.requestContext?.uploadedFileCount ?? 0 }}
                </p>
                <p>
                  <strong>Uploaded bytes:</strong>
                  {{ selectedReport.requestContext?.uploadedBytes ?? 0 }}
                </p>
              </div>
            </section>
          </div>
          <pre v-else class="report-json">{{ formattedReportRaw }}</pre>
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
/*
  The admin screen is visually emphasized as a gated control area so token
  validation and role scope are obvious before sensitive data is shown.
*/
.admin-kicker {
  margin: 0 0 0.35rem;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
  font-weight: 700;
}

.admin-access--highlight {
  border-color: #8fd4cd;
  background: linear-gradient(180deg, #f7fffd, #ffffff);
}

.admin-access__row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  gap: 0.6rem;
  align-items: center;
}

.field {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.68rem 0.78rem;
  font-size: 0.94rem;
  background: #ffffff;
}

.field:focus {
  outline: 2px solid rgba(13, 148, 136, 0.26);
  outline-offset: 1px;
}

.admin-chip-row {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.admin-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #b9e5df;
  border-radius: 999px;
  padding: 0.22rem 0.58rem;
  font-size: 0.78rem;
  color: #115e59;
  background: #ecfdf9;
}

.admin-token-catalog {
  margin: 0.9rem 0;
}

.admin-token-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.admin-token-list__item {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  background: #ffffff;
}

.admin-token-list__label {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: start;
}

.admin-token-list__meta {
  display: grid;
  gap: 0.2rem;
  font-size: 0.9rem;
}

@media (max-width: 760px) {
  .admin-access__row {
    grid-template-columns: 1fr;
  }

  .admin-token-list__label {
    grid-template-columns: 1fr;
  }
}
</style>
