<script setup lang="ts">
/*
  Superadmin token management now keeps the catalog readable on the base page
  while create/edit and per-token history move into focused modal workflows.
*/
import { computed, inject, ref, watch } from "vue";
import AccessHistoryTable from "../components/access/AccessHistoryTable.vue";
import { usePortalI18n } from "../i18n";
import {
  approveTokenRequest,
  createAccessToken,
  extendAccessToken,
  fetchAccessTokenHistory,
  listAccessTokens,
  listTokenRequests,
  rejectTokenRequest,
  resetAccessTokenUsage,
  renewAccessToken,
  revokeAccessToken,
  updateAccessToken,
} from "../services/adminTokenService";
import type {
  AccessDashboardQuery,
  AccessHistoryResult,
  AccessHistorySortDirection,
  AccessHistorySortKey,
  AccessTokenRequestRecord,
  AccessTokenRecord,
} from "../types/services";
import type { PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";

type AdminServicePoliciesForm = Record<string, string>;

interface AdminPolicyPresetMap {
  [serviceKey: string]: string[];
}

const portalContext = inject(portalContextKey) as PortalContext | undefined;
const { locale, t } = usePortalI18n() as PortalI18n;
if (!portalContext) {
  throw new Error("Portal context is not available.");
}

const SUPERADMIN_TOKEN_STORAGE_KEY = "admin_tokens_superadmin_token";
const DEFAULT_TTL = "30d";
const DEFAULT_LIST_PAGE_SIZE = 10;
const DEFAULT_HISTORY_PAGE_SIZE = 10;

const formatDateTime = (value?: string, fallbackKey = "adminTokens.notAvailable"): string =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const formatNumber = (value?: number | string): string =>
  new Intl.NumberFormat(locale.value === "el" ? "el-GR" : "en-US").format(Number(value || 0));

const tokenInput = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const activeToken = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const accessTokens = ref<AccessTokenRecord[]>([]);
const pendingRequests = ref<AccessTokenRequestRecord[]>([]);
const availableServicePolicies = ref<AdminPolicyPresetMap>({});
const revealedToken = ref("");
const revealedTokenLabel = ref("");
const editingTokenId = ref("");
const showFormModal = ref(false);
const showHistoryModal = ref(false);
const listCurrentPage = ref(1);
const listPageSize = ref(DEFAULT_LIST_PAGE_SIZE);
const historyToken = ref<AccessTokenRecord | null>(null);
const historyLoading = ref(false);
const historyError = ref("");
const historyState = ref<AccessHistoryResult | null>(null);
const historySelectedService = ref("");
const historySelectedStatus = ref("");
const historyCurrentPage = ref(1);
const historyPageSize = ref(DEFAULT_HISTORY_PAGE_SIZE);
const historySortBy = ref<AccessHistorySortKey>("createdAt");
const historySortDirection = ref<AccessHistorySortDirection>("desc");

/*
  Policy inputs are generated from the backend catalog so the form stays aligned
  with whichever preset keys the API currently exposes for each service.
*/
const buildEmptyPolicies = (): AdminServicePoliciesForm => {
  const serviceKeys = Object.keys(availableServicePolicies.value || {});
  if (serviceKeys.length === 0) {
    return {
      books_greek_editor: "",
      image: "",
      pdf: "",
      tasks: "",
    };
  }

  return Object.fromEntries(serviceKeys.map((serviceKey) => [serviceKey, ""]));
};

const form = ref({
  alias: "",
  ttl: DEFAULT_TTL,
  servicePolicies: buildEmptyPolicies(),
});

const isAuthenticated = computed(() => Boolean(activeToken.value));
const isEditing = computed(() => Boolean(editingTokenId.value));
const paginatedTokens = computed(() => {
  const startIndex = (listCurrentPage.value - 1) * listPageSize.value;
  return accessTokens.value.slice(startIndex, startIndex + listPageSize.value);
});
const listTotalPages = computed(() =>
  Math.max(1, Math.ceil(accessTokens.value.length / Math.max(1, listPageSize.value)))
);
const listCanGoPrev = computed(() => listCurrentPage.value > 1);
const listCanGoNext = computed(() => listCurrentPage.value < listTotalPages.value);
const sortedServicePolicies = computed(() =>
  Object.entries(availableServicePolicies.value || {}).sort(([left], [right]) =>
    left.localeCompare(right)
  )
);
const historyItems = computed(() => historyState.value?.items || []);
const historyTotalItems = computed(() => Number(historyState.value?.total || 0));
const historyServiceOptions = computed(() => {
  const tokenItem = historyToken.value;
  if (!tokenItem) {
    return [];
  }

  return Array.from(
    new Set([
      ...Object.keys(tokenItem.servicePolicies || {}),
      ...(tokenItem.usageSummary || []).map((item) => String(item.serviceKey || "")),
    ])
  )
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
});

const normalizeSelectedPolicies = (policies: AdminServicePoliciesForm): Record<string, string> =>
  Object.fromEntries(
    Object.entries(policies || {}).filter(([, preset]) => String(preset || "").trim())
  );

/*
  Usage summaries must distinguish consumed versus remaining quota, otherwise
  word-based plans can look healthy while the backend has already exhausted them.
*/
const formatUsageSummary = (
  serviceItem: NonNullable<AccessTokenRecord["usageSummary"]>[number]
): string => {
  const requestQuota = serviceItem?.quota?.requests;
  const wordQuota = serviceItem?.quota?.words;
  const parts = [];

  if (requestQuota && requestQuota.limit !== null) {
    parts.push(
      t("adminTokens.usage.requestsUsed", {
        used: requestQuota.used,
        limit: requestQuota.limit,
      })
    );
  }

  if (wordQuota && wordQuota.limit !== null) {
    const usedLabel = t("adminTokens.usage.wordsUsed", {
      used: wordQuota.used,
      limit: wordQuota.limit,
    });
    const remainingLabel = t("adminTokens.usage.remaining", { remaining: wordQuota.remaining });
    parts.push(`${usedLabel} (${remainingLabel})`);
  }

  return `${serviceItem.serviceKey}: ${parts.join(" · ") || t("adminTokens.usage.unlimited")}`;
};

const listPolicyEntries = (tokenItem: AccessTokenRecord): Array<[string, string]> =>
  tokenItem?.servicePolicies && Object.keys(tokenItem.servicePolicies).length > 0
    ? (Object.entries(tokenItem.servicePolicies) as Array<[string, string]>)
    : [];

const listUsageEntries = (
  tokenItem: AccessTokenRecord
): NonNullable<AccessTokenRecord["usageSummary"]> =>
  Array.isArray(tokenItem?.usageSummary) && tokenItem.usageSummary.length > 0
    ? tokenItem.usageSummary
    : [];

const resetForm = (): void => {
  editingTokenId.value = "";
  form.value = {
    alias: "",
    ttl: DEFAULT_TTL,
    servicePolicies: buildEmptyPolicies(),
  };
};

const clearReveal = (): void => {
  revealedToken.value = "";
  revealedTokenLabel.value = "";
};

const resetHistoryState = (): void => {
  historyToken.value = null;
  historyState.value = null;
  historyError.value = "";
  historySelectedService.value = "";
  historySelectedStatus.value = "";
  historyCurrentPage.value = 1;
  historyPageSize.value = DEFAULT_HISTORY_PAGE_SIZE;
  historySortBy.value = "createdAt";
  historySortDirection.value = "desc";
};

const closeFormModal = (): void => {
  showFormModal.value = false;
  resetForm();
};

const closeHistoryModal = (): void => {
  showHistoryModal.value = false;
  resetHistoryState();
};

const clearSuperadminToken = (): void => {
  activeToken.value = "";
  tokenInput.value = "";
  sessionStorage.removeItem(SUPERADMIN_TOKEN_STORAGE_KEY);
  accessTokens.value = [];
  pendingRequests.value = [];
  availableServicePolicies.value = {};
  listCurrentPage.value = 1;
  clearReveal();
  closeFormModal();
  closeHistoryModal();
  error.value = "";
  success.value = "";
};

const syncHistoryToken = (): void => {
  if (!historyToken.value) {
    return;
  }

  const nextToken = accessTokens.value.find((item) => item.tokenId === historyToken.value?.tokenId);
  if (nextToken) {
    historyToken.value = nextToken;
  }
};

const replaceTokenRecord = (nextRecord?: AccessTokenRecord | null): void => {
  if (!nextRecord?.tokenId) {
    return;
  }

  accessTokens.value = accessTokens.value.map((tokenItem) =>
    tokenItem.tokenId === nextRecord.tokenId ? nextRecord : tokenItem
  );

  if (historyToken.value?.tokenId === nextRecord.tokenId) {
    historyToken.value = nextRecord;
  }
};

const loadTokens = async (): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const data = await listAccessTokens(portalContext.apiBaseUrl.value, activeToken.value);
  accessTokens.value = Array.isArray(data.tokens) ? data.tokens : [];
  availableServicePolicies.value =
    data?.availableServicePolicies && typeof data.availableServicePolicies === "object"
      ? Object.fromEntries(
          Object.entries(data.availableServicePolicies).map(([serviceKey, presets]) => [
            serviceKey,
            Array.isArray(presets) ? presets.map((preset) => String(preset)) : [],
          ])
        )
      : {};
  syncHistoryToken();
};

const loadTokenRequests = async (): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const data = await listTokenRequests(
    portalContext.apiBaseUrl.value,
    activeToken.value,
    "pending"
  );
  pendingRequests.value = Array.isArray(data.requests) ? data.requests : [];
};

const loadAdminData = async (): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await Promise.all([loadTokens(), loadTokenRequests()]);
  } catch (loadError) {
    const message =
      loadError instanceof Error ? loadError.message : t("adminTokens.errors.loadRequests");
    clearSuperadminToken();
    error.value = message;
  } finally {
    loading.value = false;
  }
};

const loadTokenHistory = async (): Promise<void> => {
  if (!activeToken.value || !historyToken.value) {
    return;
  }

  historyLoading.value = true;
  historyError.value = "";

  try {
    const query: AccessDashboardQuery = {
      page: historyCurrentPage.value,
      limit: historyPageSize.value,
      serviceKey: historySelectedService.value,
      status: historySelectedStatus.value,
      sortBy: historySortBy.value,
      sortDirection: historySortDirection.value,
    };
    historyState.value = await fetchAccessTokenHistory(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      historyToken.value.tokenId,
      query
    );
  } catch (loadError) {
    historyError.value =
      loadError instanceof Error ? loadError.message : t("adminTokens.errors.loadHistory");
  } finally {
    historyLoading.value = false;
  }
};

const authenticate = async (): Promise<void> => {
  const nextToken = tokenInput.value.trim();
  if (!nextToken) {
    error.value = t("adminTokens.errors.enterSuperadminFirst");
    return;
  }

  activeToken.value = nextToken;
  sessionStorage.setItem(SUPERADMIN_TOKEN_STORAGE_KEY, nextToken);
  await loadAdminData();
};

const openCreateModal = (): void => {
  resetForm();
  error.value = "";
  success.value = "";
  clearReveal();
  showFormModal.value = true;
};

const startEdit = (tokenItem: AccessTokenRecord): void => {
  editingTokenId.value = tokenItem.tokenId;
  form.value = {
    alias: tokenItem.alias || "",
    ttl: DEFAULT_TTL,
    servicePolicies: {
      ...buildEmptyPolicies(),
      ...(tokenItem.servicePolicies || {}),
    },
  };
  clearReveal();
  error.value = "";
  success.value = "";
  showFormModal.value = true;
};

const openHistory = (tokenItem: AccessTokenRecord): void => {
  historyToken.value = tokenItem;
  historyState.value = null;
  historyError.value = "";
  historySelectedService.value = "";
  historySelectedStatus.value = "";
  historyCurrentPage.value = 1;
  historyPageSize.value = DEFAULT_HISTORY_PAGE_SIZE;
  historySortBy.value = "createdAt";
  historySortDirection.value = "desc";
  showHistoryModal.value = true;
};

const submitForm = async (): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";
  clearReveal();

  try {
    if (isEditing.value) {
      const result = await updateAccessToken(
        portalContext.apiBaseUrl.value,
        activeToken.value,
        editingTokenId.value,
        {
          alias: form.value.alias,
          servicePolicies: normalizeSelectedPolicies(form.value.servicePolicies),
        }
      );

      replaceTokenRecord(result?.record);
      success.value = t("adminTokens.success.updated");
      closeFormModal();
      return;
    }

    const createdAlias = form.value.alias;
    const result = await createAccessToken(portalContext.apiBaseUrl.value, activeToken.value, {
      alias: createdAlias,
      servicePolicies: normalizeSelectedPolicies(form.value.servicePolicies),
      ttl: form.value.ttl || DEFAULT_TTL,
    });

    success.value = t("adminTokens.success.created");
    revealedToken.value = result?.token || "";
    revealedTokenLabel.value = createdAlias;
    closeFormModal();
    await loadAdminData();
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : t("adminTokens.errors.saveToken");
  } finally {
    saving.value = false;
  }
};

const runRevoke = async (tokenItem: AccessTokenRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const accepted = window.confirm(t("adminTokens.prompts.revoke", { alias: tokenItem.alias }));
  if (!accepted) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const result = await revokeAccessToken(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      tokenItem.tokenId
    );
    replaceTokenRecord(result?.record);
    success.value = t("adminTokens.success.revoked");
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.revokeToken");
  } finally {
    saving.value = false;
  }
};

const promptTtl = (titleKey: string, params: Record<string, unknown> = {}): string => {
  const nextValue = window.prompt(t(titleKey, params), DEFAULT_TTL);
  return nextValue ? nextValue.trim() : "";
};

const runRenew = async (tokenItem: AccessTokenRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const ttl = promptTtl("adminTokens.prompts.renew", { alias: tokenItem.alias });
  if (!ttl) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";
  clearReveal();

  try {
    const result = await renewAccessToken(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      tokenItem.tokenId,
      ttl,
      {
        servicePolicies: tokenItem.servicePolicies || {},
      }
    );
    revealedToken.value = result?.token || "";
    revealedTokenLabel.value = result?.record?.alias || tokenItem.alias || "";
    replaceTokenRecord(result?.record);
    success.value = t("adminTokens.success.renewed");
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : t("adminTokens.errors.renewToken");
  } finally {
    saving.value = false;
  }
};

const runExtend = async (tokenItem: AccessTokenRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const ttl = promptTtl("adminTokens.prompts.extend", { alias: tokenItem.alias });
  if (!ttl) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    const result = await extendAccessToken(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      tokenItem.tokenId,
      ttl
    );
    replaceTokenRecord(result?.record);
    success.value = t("adminTokens.success.extended");
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.extendToken");
  } finally {
    saving.value = false;
  }
};

const runResetUsage = async (tokenItem: AccessTokenRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const accepted = window.confirm(t("adminTokens.prompts.resetUsage", { alias: tokenItem.alias }));
  if (!accepted) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    await resetAccessTokenUsage(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      tokenItem.tokenId
    );
    success.value = t("adminTokens.success.usageReset");
    await loadAdminData();
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : t("adminTokens.errors.resetUsage");
  } finally {
    saving.value = false;
  }
};

const runApproveRequest = async (requestItem: AccessTokenRequestRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    await approveTokenRequest(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      requestItem.requestId
    );
    success.value = t("adminTokens.success.requestApproved");
    await loadAdminData();
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.approveRequest");
  } finally {
    saving.value = false;
  }
};

const runRejectRequest = async (requestItem: AccessTokenRequestRecord): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  const reason = window.prompt(
    t("adminTokens.prompts.rejectRequest", { alias: requestItem.alias }),
    requestItem.rejectionReason || ""
  );
  if (reason === null) {
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    await rejectTokenRequest(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      requestItem.requestId,
      reason.trim()
    );
    success.value = t("adminTokens.success.requestRejected");
    await loadAdminData();
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.rejectRequest");
  } finally {
    saving.value = false;
  }
};

const goToListPage = (nextPage: number): void => {
  listCurrentPage.value = Math.min(listTotalPages.value, Math.max(1, Number(nextPage) || 1));
};

const updateListPageSize = (value: string): void => {
  listPageSize.value = Math.max(1, Number(value) || DEFAULT_LIST_PAGE_SIZE);
  listCurrentPage.value = 1;
};

const updateListPageSizeFromEvent = (event: Event): void => {
  updateListPageSize(String((event.target as HTMLSelectElement)?.value || DEFAULT_LIST_PAGE_SIZE));
};

watch([accessTokens, listPageSize], () => {
  if (listCurrentPage.value > listTotalPages.value) {
    listCurrentPage.value = listTotalPages.value;
  }
});

watch([historySelectedService, historySelectedStatus], () => {
  historyCurrentPage.value = 1;
});

watch(
  () => [
    showHistoryModal.value,
    activeToken.value,
    historyToken.value?.tokenId || "",
    historySelectedService.value,
    historySelectedStatus.value,
    historyCurrentPage.value,
    historyPageSize.value,
    historySortBy.value,
    historySortDirection.value,
  ],
  ([isVisible, tokenValue, tokenId]) => {
    if (!isVisible || !tokenValue || !tokenId) {
      return;
    }

    void loadTokenHistory();
  }
);

if (activeToken.value) {
  void loadAdminData();
}
</script>

<template>
  <section class="flow-view" :aria-label="t('adminTokens.ariaLabel')">
    <div class="section-head section-head--spaced admin-head">
      <div>
        <p class="admin-kicker">{{ t("adminTokens.restrictedArea") }}</p>
        <h2 class="section-head__title">
          {{ t("adminTokens.title") }}
        </h2>
        <p class="section-head__subtitle">
          {{ t("adminTokens.subtitle") }}
        </p>
      </div>
      <button
        v-if="isAuthenticated"
        type="button"
        class="button button--secondary"
        :disabled="loading || saving"
        @click="loadAdminData"
      >
        {{ loading ? t("adminTokens.refreshing") : t("adminTokens.refresh") }}
      </button>
    </div>

    <article class="tool-card admin-access admin-access--highlight">
      <h3 class="tool-card__title">{{ t("adminTokens.sessionTitle") }}</h3>
      <p class="tool-card__description">
        {{ t("adminTokens.sessionSubtitle") }}
      </p>
      <div class="admin-access__row">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          :placeholder="t('adminTokens.superadminPlaceholder')"
          autocomplete="off"
        />
        <button
          type="button"
          class="button button--primary"
          :disabled="loading || saving"
          @click="authenticate"
        >
          {{ t("adminTokens.enter") }}
        </button>
        <button
          v-if="isAuthenticated"
          type="button"
          class="button button--secondary"
          :disabled="loading || saving"
          @click="clearSuperadminToken"
        >
          {{ t("adminTokens.clear") }}
        </button>
      </div>
    </article>

    <p v-if="error && !showFormModal" class="tool-card__description tool-card__description--error">
      {{ error }}
    </p>
    <p v-if="success" class="tool-card__description">{{ success }}</p>

    <article v-if="revealedToken" class="tool-card admin-reveal">
      <h3 class="tool-card__title">{{ t("adminTokens.plaintextTitle") }}</h3>
      <p class="tool-card__description">
        {{ t("adminTokens.plaintextDescription", { label: revealedTokenLabel }) }}
      </p>
      <pre class="admin-reveal__token">{{ revealedToken }}</pre>
    </article>

    <article v-if="isAuthenticated" class="tool-card admin-requests">
      <div class="admin-list__head">
        <div>
          <h3 class="tool-card__title">{{ t("adminTokens.requestNotifications") }}</h3>
          <p class="tool-card__description">{{ t("adminTokens.requestNotificationsSubtitle") }}</p>
        </div>
        <span class="admin-chip admin-chip--active">{{
          formatNumber(pendingRequests.length)
        }}</span>
      </div>

      <p v-if="!loading && pendingRequests.length === 0" class="tool-card__description">
        {{ t("adminTokens.pendingRequestsEmpty") }}
      </p>

      <ul v-else class="admin-request-list" role="list">
        <li
          v-for="requestItem in pendingRequests"
          :key="requestItem.requestId"
          class="admin-request-list__item"
        >
          <div class="admin-token-list__head">
            <strong class="admin-token-list__alias">{{ requestItem.alias }}</strong>
            <span class="admin-chip">{{ requestItem.status }}</span>
          </div>

          <div class="admin-token-list__meta-grid">
            <article class="admin-meta-item">
              <span class="admin-meta-item__label">{{ t("adminTokens.requestedBy") }}</span>
              <strong class="admin-meta-item__value">{{ requestItem.email }}</strong>
            </article>
            <article class="admin-meta-item">
              <span class="admin-meta-item__label">{{ t("adminTokens.requestedAt") }}</span>
              <strong class="admin-meta-item__value">{{
                formatDateTime(requestItem.createdAt)
              }}</strong>
            </article>
            <article v-if="requestItem.lastEmailError" class="admin-meta-item">
              <span class="admin-meta-item__label">{{
                t("adminTokens.requestDeliveryError")
              }}</span>
              <strong class="admin-meta-item__value">{{ requestItem.lastEmailError }}</strong>
            </article>
          </div>

          <div class="admin-token-list__block">
            <p class="admin-token-list__block-title">{{ t("adminTokens.requestedLimits") }}</p>
            <div class="admin-token-list__tags">
              <span
                v-for="[serviceKey, preset] in Object.entries(requestItem.servicePolicies || {})"
                :key="`${requestItem.requestId}-${serviceKey}`"
                class="admin-token-list__tag"
              >
                <strong>{{ serviceKey }}</strong>
                <span>{{ preset }}</span>
              </span>
            </div>
          </div>

          <div class="preview-card__actions">
            <button
              type="button"
              class="button button--primary"
              :disabled="saving"
              @click="runApproveRequest(requestItem)"
            >
              {{ t("adminTokens.approveRequest") }}
            </button>
            <button
              type="button"
              class="button button--secondary"
              :disabled="saving"
              @click="runRejectRequest(requestItem)"
            >
              {{ t("adminTokens.rejectRequest") }}
            </button>
          </div>
        </li>
      </ul>
    </article>

    <article v-if="isAuthenticated" class="tool-card admin-list">
      <div class="admin-list__head">
        <div>
          <h3 class="tool-card__title">{{ t("adminTokens.accessTokens") }}</h3>
          <p class="tool-card__description">
            {{ t("adminTokens.total") }}: {{ accessTokens.length }}
          </p>
        </div>
        <div class="admin-list__toolbar">
          <select
            :value="String(listPageSize)"
            class="rotation-select"
            :disabled="loading || saving"
            @change="updateListPageSizeFromEvent"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <button
            type="button"
            class="button button--primary"
            :disabled="loading || saving"
            @click="openCreateModal"
          >
            {{ t("adminTokens.createToken") }}
          </button>
        </div>
      </div>

      <p v-if="loading" class="tool-card__description">
        {{ t("adminTokens.loadingList") }}
      </p>
      <p v-else-if="accessTokens.length === 0" class="tool-card__description">
        {{ t("adminTokens.noAccessTokens") }}
      </p>
      <template v-else>
        <ul class="admin-token-list" role="list">
          <li
            v-for="tokenItem in paginatedTokens"
            :key="tokenItem.tokenId"
            class="admin-token-list__item"
          >
            <div class="admin-token-list__head">
              <strong class="admin-token-list__alias">{{ tokenItem.alias }}</strong>
              <div class="admin-chip-row">
                <span v-if="tokenItem.isActive" class="admin-chip admin-chip--active">{{
                  t("adminTokens.active")
                }}</span>
                <span v-else-if="tokenItem.isRevoked" class="admin-chip admin-chip--revoked">{{
                  t("adminTokens.revoked")
                }}</span>
                <span v-else-if="tokenItem.isExpired" class="admin-chip admin-chip--expired">{{
                  t("adminTokens.expired")
                }}</span>
                <span v-if="tokenItem.renewedAt" class="admin-chip">
                  {{ t("adminTokens.renewed") }} {{ formatDateTime(tokenItem.renewedAt) }}
                </span>
                <span v-if="tokenItem.extendedAt" class="admin-chip">
                  {{ t("adminTokens.extended") }} {{ formatDateTime(tokenItem.extendedAt) }}
                </span>
              </div>
            </div>

            <div class="admin-token-list__meta-grid">
              <article class="admin-meta-item">
                <span class="admin-meta-item__label">{{ t("adminTokens.type") }}</span>
                <strong class="admin-meta-item__value">{{ tokenItem.tokenType }}</strong>
              </article>
              <article class="admin-meta-item">
                <span class="admin-meta-item__label">{{ t("adminTokens.expires") }}</span>
                <strong class="admin-meta-item__value">{{
                  formatDateTime(tokenItem.expiresAt)
                }}</strong>
              </article>
              <article class="admin-meta-item">
                <span class="admin-meta-item__label">{{ t("adminTokens.id") }}</span>
                <strong class="admin-meta-item__value admin-meta-item__value--mono">{{
                  tokenItem.tokenId
                }}</strong>
              </article>
              <article v-if="tokenItem.usageResetAt" class="admin-meta-item">
                <span class="admin-meta-item__label">{{ t("adminTokens.usageReset") }}</span>
                <strong class="admin-meta-item__value">{{
                  formatDateTime(tokenItem.usageResetAt)
                }}</strong>
              </article>
            </div>

            <div class="admin-token-list__block">
              <p class="admin-token-list__block-title">{{ t("adminTokens.policies") }}</p>
              <div v-if="listPolicyEntries(tokenItem).length" class="admin-token-list__tags">
                <span
                  v-for="[serviceKey, preset] in listPolicyEntries(tokenItem)"
                  :key="`${tokenItem.tokenId}-${serviceKey}`"
                  class="admin-token-list__tag"
                >
                  <strong>{{ serviceKey }}</strong>
                  <span>{{ preset }}</span>
                </span>
              </div>
              <p v-else class="tool-card__description">{{ t("adminTokens.none") }}</p>
            </div>

            <div v-if="listUsageEntries(tokenItem).length" class="admin-token-list__block">
              <p class="admin-token-list__block-title">{{ t("adminTokens.usageLabel") }}</p>
              <div class="admin-token-list__usage-grid">
                <article
                  v-for="item in listUsageEntries(tokenItem)"
                  :key="`${tokenItem.tokenId}-${item.serviceKey}`"
                  class="admin-usage-item"
                >
                  {{ formatUsageSummary(item) }}
                </article>
              </div>
            </div>

            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving"
                @click="openHistory(tokenItem)"
              >
                {{ t("adminTokens.history") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || !tokenItem.isActive"
                @click="runResetUsage(tokenItem)"
              >
                {{ t("adminTokens.resetUsageAction") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving"
                @click="startEdit(tokenItem)"
              >
                {{ t("adminTokens.edit") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || tokenItem.isRevoked"
                @click="runRevoke(tokenItem)"
              >
                {{ t("adminTokens.revoke") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || (!tokenItem.isRevoked && !tokenItem.isExpired)"
                @click="runRenew(tokenItem)"
              >
                {{ t("adminTokens.renew") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || tokenItem.isRevoked"
                @click="runExtend(tokenItem)"
              >
                {{ t("adminTokens.extend") }}
              </button>
            </div>
          </li>
        </ul>

        <div class="admin-pagination">
          <button
            type="button"
            class="rotation-select"
            :disabled="!listCanGoPrev"
            @click="goToListPage(listCurrentPage - 1)"
          >
            {{ t("accessDashboard.pagination.previous") }}
          </button>
          <span>
            {{
              t("accessDashboard.pagination.summary", {
                page: listCurrentPage,
                totalPages: listTotalPages,
                totalItems: formatNumber(accessTokens.length),
              })
            }}
          </span>
          <button
            type="button"
            class="rotation-select"
            :disabled="!listCanGoNext"
            @click="goToListPage(listCurrentPage + 1)"
          >
            {{ t("accessDashboard.pagination.next") }}
          </button>
        </div>
      </template>
    </article>

    <div
      v-if="showFormModal"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="
        isEditing ? t('adminTokens.editAccessToken') : t('adminTokens.createAccessToken')
      "
      @click.self="closeFormModal"
    >
      <article class="admin-modal__card">
        <div class="admin-modal__head">
          <div>
            <h3 class="tool-card__title">
              {{
                isEditing ? t("adminTokens.editAccessToken") : t("adminTokens.createAccessToken")
              }}
            </h3>
            <p class="tool-card__description">
              {{
                isEditing
                  ? t("adminTokens.editModalDescription")
                  : t("adminTokens.createModalDescription")
              }}
            </p>
          </div>
          <button type="button" class="button button--secondary" @click="closeFormModal">
            {{ t("modal.close") }}
          </button>
        </div>

        <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>

        <div class="admin-form">
          <label class="admin-form__field">
            <span>{{ t("adminTokens.alias") }}</span>
            <input
              v-model="form.alias"
              type="text"
              class="field"
              :disabled="saving"
              :placeholder="t('adminTokens.aliasPlaceholder')"
            />
          </label>

          <label v-if="!isEditing" class="admin-form__field">
            <span>{{ t("adminTokens.ttl") }}</span>
            <input
              v-model="form.ttl"
              type="text"
              class="field"
              :disabled="saving"
              :placeholder="DEFAULT_TTL"
            />
          </label>

          <div class="admin-form__field">
            <span>{{ t("adminTokens.servicePolicies") }}</span>
            <div class="admin-policy-grid">
              <label
                v-for="[serviceKey, presets] in sortedServicePolicies"
                :key="serviceKey"
                class="admin-form__field"
              >
                <span>{{ serviceKey }}</span>
                <select v-model="form.servicePolicies[serviceKey]" class="field" :disabled="saving">
                  <option value="">{{ t("adminTokens.disabled") }}</option>
                  <option v-for="preset in presets" :key="preset" :value="preset">
                    {{ preset }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div class="preview-card__actions">
            <button
              type="button"
              class="button button--primary"
              :disabled="saving"
              @click="submitForm"
            >
              {{
                saving
                  ? t("adminTokens.saving")
                  : isEditing
                    ? t("adminTokens.saveChanges")
                    : t("adminTokens.createToken")
              }}
            </button>
            <button
              type="button"
              class="button button--secondary"
              :disabled="saving"
              @click="resetForm"
            >
              {{ t("adminTokens.reset") }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="showHistoryModal"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('adminTokens.history')"
      @click.self="closeHistoryModal"
    >
      <article class="admin-modal__card admin-modal__card--history">
        <div class="admin-modal__head">
          <div>
            <h3 class="tool-card__title">{{ t("adminTokens.history") }}</h3>
            <p class="tool-card__description">
              {{
                t("adminTokens.historyDescription", {
                  label:
                    historyToken?.alias || historyToken?.tokenId || t("adminTokens.notAvailable"),
                })
              }}
            </p>
          </div>
          <button type="button" class="button button--secondary" @click="closeHistoryModal">
            {{ t("modal.close") }}
          </button>
        </div>

        <AccessHistoryTable
          :loading="historyLoading"
          :error="historyError"
          :items="historyItems"
          :service-options="historyServiceOptions"
          :selected-service="historySelectedService"
          :selected-status="historySelectedStatus"
          :page="historyCurrentPage"
          :page-size="historyPageSize"
          :total-items="historyTotalItems"
          :sort-by="historySortBy"
          :sort-direction="historySortDirection"
          :loading-message="t('adminTokens.historyLoading')"
          :empty-message="t('adminTokens.historyEmpty')"
          @update:selected-service="historySelectedService = $event"
          @update:selected-status="historySelectedStatus = $event"
          @update:page-size="historyPageSize = $event"
          @update:page="historyCurrentPage = $event"
          @update:sort-by="historySortBy = $event"
          @update:sort-direction="historySortDirection = $event"
        />
      </article>
    </div>
  </section>
</template>

<style src="./AdminTokensView.scss" lang="scss"></style>
