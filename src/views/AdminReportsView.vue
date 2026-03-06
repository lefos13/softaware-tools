<script setup>
/*
  Token-gated admin reporting keeps the screen hidden from public browsing and
  only reveals superadmin controls when the validated token role allows it.
*/
import { computed, inject, ref } from "vue";
import { usePortalI18n } from "../i18n";
import {
  getFailureReport,
  invalidateAllAdminTokens,
  listAdminTokens,
  listFailureReports,
  revokeAdminTokens,
} from "../services/adminReportsService";

const portalContext = inject("portalContext");
const { locale } = usePortalI18n();
const TOKEN_STORAGE_KEY = "admin_reports_token";
const tr = (en, el) => (locale.value === "el" ? el : en);
const formatDateTime = (value, fallbackEn = "n/a", fallbackEl = "δ/υ") =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : tr(fallbackEn, fallbackEl);

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
      loadError instanceof Error
        ? loadError.message
        : tr("Could not load admin token inventory", "Δεν ήταν δυνατή η φόρτωση των admin tokens");
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
    error.value =
      loadError instanceof Error
        ? loadError.message
        : tr(
            "Could not load report details",
            "Δεν ήταν δυνατή η φόρτωση των στοιχείων της αναφοράς"
          );
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
    error.value =
      loadError instanceof Error
        ? loadError.message
        : tr("Could not load reports", "Δεν ήταν δυνατή η φόρτωση των αναφορών");
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
      error.value = tr("Enter an admin token.", "Συμπληρώστε ένα admin token.");
      return;
    }

    activeToken.value = nextToken;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    await loadReports();
  } catch (authError) {
    error.value =
      authError instanceof Error
        ? authError.message
        : tr("Could not validate token", "Δεν ήταν δυνατός ο έλεγχος του token");
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
    tr(
      "Invalidate all admin and superadmin tokens now? This will also revoke your current token.",
      "Να ακυρωθούν τώρα όλα τα admin και superadmin tokens; Θα ακυρωθεί και το τρέχον token σας."
    )
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
    error.value =
      runError instanceof Error
        ? runError.message
        : tr("Could not invalidate tokens", "Δεν ήταν δυνατή η ακύρωση των tokens");
  } finally {
    invalidateLoading.value = false;
  }
};

const runRevokeSelected = async () => {
  if (!isSuperAdmin.value || !activeToken.value || selectedTokenIds.value.length === 0) {
    return;
  }

  const accepted = window.confirm(
    tr(
      `Revoke ${selectedTokenIds.value.length} selected token(s)? This can include your current session.`,
      `Να ανακληθούν ${selectedTokenIds.value.length} επιλεγμένα token(s); Μπορεί να περιλαμβάνεται και η τρέχουσα συνεδρία σας.`
    )
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
    error.value =
      runError instanceof Error
        ? runError.message
        : tr(
            "Could not revoke selected tokens",
            "Δεν ήταν δυνατή η ανάκληση των επιλεγμένων tokens"
          );
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
        <p class="admin-kicker">{{ tr("Restricted Area", "Περιορισμένη πρόσβαση") }}</p>
        <h2 class="section-head__title">
          {{ tr("Admin Failure Reports", "Αναφορές αποτυχίας admin") }}
        </h2>
        <p class="section-head__subtitle">
          {{
            tr(
              "Enter an admin token to view owner-scoped failure reports.",
              "Συμπληρώστε admin token για να δείτε αναφορές αποτυχίας για τον συγκεκριμένο owner."
            )
          }}
        </p>
      </div>
      <button
        v-if="isAuthenticated"
        type="button"
        class="button button--secondary"
        :disabled="loading"
        @click="loadReports"
      >
        {{ loading ? tr("Refreshing...", "Ανανέωση...") : tr("Refresh", "Ανανέωση") }}
      </button>
    </div>

    <article class="tool-card admin-access admin-access--highlight">
      <h3 class="tool-card__title">{{ tr("Access Token", "Token πρόσβασης") }}</h3>
      <p class="tool-card__description">
        {{
          tr(
            "Use the plaintext token generated by softaware studios.",
            "Χρησιμοποιήστε το token απλού κειμένου που δημιουργήθηκε από τη softaware studios."
          )
        }}
      </p>
      <div class="admin-access__row">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          :placeholder="tr('Enter admin token', 'Συμπληρώστε admin token')"
          autocomplete="off"
        />
        <button
          type="button"
          class="button button--primary"
          :disabled="tokenLoading || loading"
          @click="authenticate"
        >
          {{ tokenLoading ? tr("Validating...", "Έλεγχος...") : tr("Enter", "Είσοδος") }}
        </button>
        <button
          v-if="isAuthenticated"
          type="button"
          class="button button--secondary"
          :disabled="tokenLoading || loading || invalidateLoading"
          @click="clearToken"
        >
          {{ tr("Clear", "Καθαρισμός") }}
        </button>
      </div>
      <p v-if="isAuthenticated" class="tool-card__description">
        {{ tr("Role", "Ρόλος") }}: <strong>{{ viewerRole || tr("unknown", "άγνωστο") }}</strong> ·
        {{ tr("Scope owner", "Owner πρόσβασης") }}:
        <code>{{ viewerOwnerId || tr("n/a", "δ/υ") }}</code>
      </p>
      <div v-if="isAuthenticated" class="admin-chip-row">
        <span class="admin-chip">{{ tr("Validated session", "Επιβεβαιωμένη συνεδρία") }}</span>
        <span class="admin-chip">{{ tr("Scoped access active", "Ενεργή scoped πρόσβαση") }}</span>
      </div>
    </article>

    <article v-if="isSuperAdmin" class="tool-card admin-super">
      <h3 class="tool-card__title">{{ tr("Superadmin Controls", "Έλεγχοι superadmin") }}</h3>
      <p class="tool-card__description">
        {{
          tr(
            "Review token sessions, revoke selected tokens, or invalidate all admin/superadmin tokens immediately.",
            "Δείτε τις συνεδρίες token, ανακαλέστε επιλεγμένα tokens ή ακυρώστε αμέσως όλα τα admin/superadmin tokens."
          )
        }}
      </p>
      <div class="preview-card__actions">
        <button
          type="button"
          class="button button--secondary"
          :disabled="tokenCatalogLoading || revokeSelectedLoading || invalidateLoading"
          @click="loadAdminTokenCatalog"
        >
          {{
            tokenCatalogLoading
              ? tr("Refreshing tokens...", "Ανανέωση tokens...")
              : tr("Refresh token inventory", "Ανανέωση λίστας tokens")
          }}
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
          {{
            revokeSelectedLoading
              ? tr("Revoking...", "Ανάκληση...")
              : tr(
                  `Revoke selected (${selectedTokenCount})`,
                  `Ανάκληση επιλεγμένων (${selectedTokenCount})`
                )
          }}
        </button>
      </div>
      <div class="admin-token-catalog">
        <p v-if="tokenCatalogLoading" class="tool-card__description">
          {{ tr("Loading token inventory...", "Φόρτωση λίστας tokens...") }}
        </p>
        <p v-else-if="adminTokens.length === 0" class="tool-card__description">
          {{ tr("No admin tokens found.", "Δεν βρέθηκαν admin tokens.") }}
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
                <span
                  >{{ tr("owner", "owner") }}
                  {{ tokenItem.ownerId || tr("public", "public") }}</span
                >
                <span>id {{ tokenItem.tokenId }}</span>
                <span>
                  {{
                    tokenItem.expiresAt
                      ? tr(
                          `expires ${formatDateTime(tokenItem.expiresAt)}`,
                          `λήγει ${formatDateTime(tokenItem.expiresAt)}`
                        )
                      : tr("no expiry", "χωρίς λήξη")
                  }}
                </span>
              </span>
            </label>
            <div class="admin-chip-row">
              <span
                v-if="tokenItem.isCurrent || tokenItem.tokenId === currentAdminTokenId"
                class="admin-chip"
              >
                {{ tr("Current session", "Τρέχουσα συνεδρία") }}
              </span>
              <span v-if="tokenItem.isActive" class="admin-chip">{{ tr("Active", "Ενεργό") }}</span>
              <span v-else-if="tokenItem.revokedAt" class="admin-chip">{{
                tr("Revoked", "Ανακλήθηκε")
              }}</span>
              <span v-else-if="tokenItem.isExpired" class="admin-chip">{{
                tr("Expired", "Έληξε")
              }}</span>
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
        {{
          invalidateLoading
            ? tr("Invalidating...", "Ακύρωση...")
            : tr("Invalidate all tokens", "Ακύρωση όλων των tokens")
        }}
      </button>
    </article>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>

    <div v-if="isAuthenticated" class="admin-layout">
      <article class="tool-card admin-list">
        <h3 class="tool-card__title">{{ tr("Recent Reports", "Πρόσφατες αναφορές") }}</h3>
        <p class="tool-card__description">{{ tr("Total", "Σύνολο") }}: {{ reports.length }}</p>

        <p v-if="!loading && reports.length === 0" class="tool-card__description">
          {{
            tr(
              "No reports found for this owner scope.",
              "Δεν βρέθηκαν αναφορές για αυτό το owner scope."
            )
          }}
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
                item.createdAt
                  ? formatDateTime(item.createdAt, "Unknown time", "Άγνωστη ώρα")
                  : tr("Unknown time", "Άγνωστη ώρα")
              }}</span>
            </button>
          </li>
        </ul>
      </article>

      <article class="tool-card admin-detail">
        <h3 class="tool-card__title">{{ tr("Report Details", "Στοιχεία αναφοράς") }}</h3>
        <p v-if="selectedSummary" class="tool-card__description">
          {{ tr("File", "Αρχείο") }}: <code>{{ selectedSummary.fileName }}</code>
        </p>
        <div v-if="selectedReport" class="preview-card__actions">
          <button
            type="button"
            class="button button--secondary"
            :disabled="reportViewMode === 'pretty'"
            @click="reportViewMode = 'pretty'"
          >
            {{ tr("Pretty", "Μορφοποιημένο") }}
          </button>
          <button
            type="button"
            class="button button--secondary"
            :disabled="reportViewMode === 'raw'"
            @click="reportViewMode = 'raw'"
          >
            {{ tr("Raw", "Ακατέργαστο") }}
          </button>
        </div>
        <p v-if="detailLoading" class="tool-card__description">
          {{ tr("Loading report details...", "Φόρτωση στοιχείων αναφοράς...") }}
        </p>
        <p v-else-if="!selectedReport" class="tool-card__description">
          {{
            tr(
              "Select a report to inspect details.",
              "Επιλέξτε μια αναφορά για να δείτε λεπτομέρειες."
            )
          }}
        </p>
        <template v-else>
          <div v-if="reportViewMode === 'pretty'" class="pretty-report">
            <section class="pretty-report__section">
              <h4 class="pretty-report__title">{{ tr("Summary", "Σύνοψη") }}</h4>
              <div class="pretty-grid">
                <p>
                  <strong>{{ tr("Request ID", "Request ID") }}:</strong>
                  <code>{{ selectedReport.requestId || tr("n/a", "δ/υ") }}</code>
                </p>
                <p>
                  <strong>{{ tr("Task ID", "Task ID") }}:</strong>
                  <code>{{ selectedReport.taskId || tr("n/a", "δ/υ") }}</code>
                </p>
                <p>
                  <strong>{{ tr("Created", "Δημιουργήθηκε") }}:</strong>
                  {{ formatDateTime(selectedReport.createdAt) }}
                </p>
                <p>
                  <strong>{{ tr("Type", "Τύπος") }}:</strong>
                  {{ selectedReport.reportType || "request-failure" }}
                </p>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">{{ tr("Operation", "Λειτουργία") }}</h4>
              <div class="pretty-grid">
                <p>
                  <strong>{{ tr("Method", "Μέθοδος") }}:</strong>
                  <code>{{ selectedReport.operation?.method || tr("n/a", "δ/υ") }}</code>
                </p>
                <p>
                  <strong>{{ tr("Path", "Διαδρομή") }}:</strong>
                  <code>{{ selectedReport.operation?.path || tr("n/a", "δ/υ") }}</code>
                </p>
              </div>
              <div v-if="operationIntentEntries.length > 0" class="pretty-subsection">
                <p class="pretty-subsection__title">{{ tr("Intent", "Σκοπός") }}</p>
                <ul class="pretty-list">
                  <li v-for="[key, value] in operationIntentEntries" :key="key">
                    <strong>{{ key }}:</strong>
                    <code>{{ typeof value === "string" ? value : safeStringify(value) }}</code>
                  </li>
                </ul>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">{{ tr("Failure", "Σφάλμα") }}</h4>
              <div class="pretty-grid">
                <p>
                  <strong>{{ tr("Status", "Κατάσταση") }}:</strong>
                  {{ selectedReport.failure?.statusCode ?? tr("n/a", "δ/υ") }}
                </p>
                <p>
                  <strong>{{ tr("Code", "Κωδικός") }}:</strong>
                  <code>{{ selectedReport.failure?.code || tr("n/a", "δ/υ") }}</code>
                </p>
              </div>
              <p class="pretty-message">
                {{ selectedReport.failure?.message || tr("n/a", "δ/υ") }}
              </p>
              <div v-if="selectedReport.failure?.details?.length" class="pretty-subsection">
                <p class="pretty-subsection__title">{{ tr("Details", "Λεπτομέρειες") }}</p>
                <ul class="pretty-list">
                  <li v-for="(detail, index) in selectedReport.failure.details" :key="index">
                    <strong>{{ detail.field || tr("field", "πεδίο") }}:</strong>
                    {{ detail.issue || tr("Invalid value", "Μη έγκυρη τιμή") }}
                  </li>
                </ul>
              </div>
            </section>

            <section class="pretty-report__section">
              <h4 class="pretty-report__title">
                {{ tr("Request Context", "Στοιχεία αιτήματος") }}
              </h4>
              <div class="pretty-grid">
                <p>
                  <strong>{{ tr("Body keys", "Κλειδιά body") }}:</strong>
                  {{
                    (selectedReport.requestContext?.bodyKeys || []).join(", ") ||
                    tr("none", "κανένα")
                  }}
                </p>
                <p>
                  <strong>{{ tr("Query keys", "Κλειδιά query") }}:</strong>
                  {{
                    (selectedReport.requestContext?.queryKeys || []).join(", ") ||
                    tr("none", "κανένα")
                  }}
                </p>
              </div>
              <div class="pretty-grid">
                <p>
                  <strong>{{ tr("Uploaded files", "Ανεβασμένα αρχεία") }}:</strong>
                  {{ selectedReport.requestContext?.uploadedFileCount ?? 0 }}
                </p>
                <p>
                  <strong>{{ tr("Uploaded bytes", "Uploaded bytes") }}:</strong>
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
