<script setup lang="ts">
/*
  Superadmin token management now keeps the catalog readable on the base page
  while create/edit and per-token history move into focused modal workflows.
*/
import { computed, inject, ref, watch } from "vue";
import {
  FlexRender,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type SortingState,
  type Updater,
} from "@tanstack/vue-table";
import AccessHistoryTable from "../components/access/AccessHistoryTable.vue";
import AdminActionIconAsset from "../assets/svgs/AdminActionIconAsset.vue";
import AdminBellIconAsset from "../assets/svgs/AdminBellIconAsset.vue";
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
import { formatAccessServiceLabel } from "../utils/accessServiceLabels";

type AdminServicePoliciesForm = Record<string, string>;
type RequestDecisionAction = "approve" | "reject";
type AdminTokenStatusKey = "active" | "revoked" | "expired";
type TokenRowAction = "details" | "history" | "resetUsage" | "edit" | "revoke" | "renew" | "extend";

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

const formatMoney = (amount?: number, currency = "EUR"): string =>
  new Intl.NumberFormat(locale.value === "el" ? "el-GR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatPresetLabel = (preset?: string): string =>
  t(
    `plans.presetLabels.common.${String(preset || "").trim()}`,
    {},
    String(preset || "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

const formatServiceLabel = (serviceKey?: string): string =>
  formatAccessServiceLabel(t, serviceKey) || t("adminTokens.notAvailable");

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
const showDetailsModal = ref(false);
const showRequestsModal = ref(false);
const showRequestResultModal = ref(false);
const requestResultTitle = ref("");
const requestResultDescription = ref("");
const pendingRequestAction = ref<{ requestId: string; action: RequestDecisionAction } | null>(null);
const listSearch = ref("");
const listStatusFilter = ref<"all" | AdminTokenStatusKey>("all");
const listTypeFilter = ref("all");
const listSort = ref("createdAt:desc");
const sorting = ref<SortingState>([{ id: "createdAt", desc: true }]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({
  createdAt: false,
});
const globalFilter = ref("");
const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: DEFAULT_LIST_PAGE_SIZE,
});
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
const detailsToken = ref<AccessTokenRecord | null>(null);

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

/*
  The header action area needs a simple binary state so the requests trigger can
  switch between an idle bell and a highlighted pending-requests bell.
*/
const hasPendingRequests = computed(() => pendingRequests.value.length > 0);
const pendingRequestsCountLabel = computed(() => formatNumber(pendingRequests.value.length));
const requestBellAriaLabel = computed(() =>
  hasPendingRequests.value
    ? `${t("adminTokens.requestNotifications")}: ${pendingRequestsCountLabel.value}`
    : t("adminTokens.pendingRequestsEmpty")
);

const normalizeSelectedPolicies = (policies: AdminServicePoliciesForm): Record<string, string> =>
  Object.fromEntries(
    Object.entries(policies || {}).filter(([, preset]) => String(preset || "").trim())
  );

/*
  TanStack powers sorting/filtering/pagination while dynamic service columns
  expose each policy and quota indicator separately for easier scanning.
*/
const resolveTokenStatus = (tokenItem: AccessTokenRecord): AdminTokenStatusKey => {
  if (tokenItem.isActive) {
    return "active";
  }

  if (tokenItem.isRevoked) {
    return "revoked";
  }

  return "expired";
};

/*
  Service policy and quota columns were moved out of the grid into a modal so
  the main table remains readable while keeping full token limits available.
*/
const detailsPolicyEntries = computed(() =>
  detailsToken.value?.servicePolicies ? Object.entries(detailsToken.value.servicePolicies) : []
);
const detailsPricingEntries = computed(() => detailsToken.value?.pricing?.items || []);

const detailsUsageEntries = computed(
  () =>
    (Array.isArray(detailsToken.value?.usageSummary) ? detailsToken.value?.usageSummary : []) || []
);

const listTypeOptions = computed(() =>
  Array.from(new Set(accessTokens.value.map((tokenItem) => String(tokenItem.tokenType || ""))))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
);

const applyUpdater = <T,>(updater: Updater<T>, previousValue: T): T =>
  typeof updater === "function" ? (updater as (old: T) => T)(previousValue) : updater;

const columnHelper = createColumnHelper<AccessTokenRecord>();
const tableColumns = computed(
  () =>
    [
      columnHelper.accessor((row) => String(row.alias || ""), {
        id: "alias",
        header: t("adminTokens.columns.alias"),
      }),
      columnHelper.accessor((row) => String(row.tokenType || ""), {
        id: "tokenType",
        header: t("adminTokens.columns.type"),
      }),
      columnHelper.accessor((row) => String(row.createdAt || ""), {
        id: "createdAt",
        header: t("adminTokens.columns.createdAt"),
        sortingFn: (left, right, columnId) => {
          const leftDate = Date.parse(String(left.getValue(columnId) || "")) || 0;
          const rightDate = Date.parse(String(right.getValue(columnId) || "")) || 0;
          return leftDate - rightDate;
        },
      }),
      columnHelper.accessor((row) => String(row.tokenId || ""), {
        id: "tokenId",
        header: t("adminTokens.columns.identifier"),
      }),
      columnHelper.accessor((row) => resolveTokenStatus(row), {
        id: "status",
        header: t("adminTokens.columns.status"),
      }),
      columnHelper.accessor((row) => String(row.expiresAt || ""), {
        id: "expiresAt",
        header: t("adminTokens.columns.expires"),
        sortingFn: (left, right, columnId) => {
          const leftDate = Date.parse(String(left.getValue(columnId) || "")) || 0;
          const rightDate = Date.parse(String(right.getValue(columnId) || "")) || 0;
          return leftDate - rightDate;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: t("adminTokens.columns.actions"),
      }),
    ] as ColumnDef<AccessTokenRecord, unknown>[]
);

const tokenTable = useVueTable({
  get data() {
    return accessTokens.value;
  },
  get columns() {
    return tableColumns.value;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value = applyUpdater(updater, sorting.value);
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value = applyUpdater(updater, columnFilters.value);
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value = applyUpdater(updater, columnVisibility.value);
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value = applyUpdater(updater, globalFilter.value);
  },
  onPaginationChange: (updater) => {
    pagination.value = applyUpdater(updater, pagination.value);
  },
  globalFilterFn: (row, _columnId, filterValue) => {
    const normalized = String(filterValue || "")
      .trim()
      .toLowerCase();
    if (!normalized) {
      return true;
    }

    return (
      String(row.original.alias || "")
        .toLowerCase()
        .includes(normalized) ||
      String(row.original.tokenId || "")
        .toLowerCase()
        .includes(normalized)
    );
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

const paginatedRows = computed(() => tokenTable.getRowModel().rows);
const filteredTokensCount = computed(() => tokenTable.getFilteredRowModel().rows.length);
const listCurrentPage = computed(() => tokenTable.getState().pagination.pageIndex + 1);
const listTotalPages = computed(() => Math.max(1, tokenTable.getPageCount()));
const listCanGoPrev = computed(() => tokenTable.getCanPreviousPage());
const listCanGoNext = computed(() => tokenTable.getCanNextPage());
const visiblePageNumbers = computed(() => {
  const current = listCurrentPage.value;
  const total = listTotalPages.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

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

const openDetailsModal = (tokenItem: AccessTokenRecord): void => {
  detailsToken.value = tokenItem;
  showDetailsModal.value = true;
};

const closeDetailsModal = (): void => {
  showDetailsModal.value = false;
  detailsToken.value = null;
};

const openRequestsModal = (): void => {
  showRequestsModal.value = true;
};

const closeRequestsModal = (): void => {
  showRequestsModal.value = false;
};

/*
  Request review actions can take a few seconds while the backend sends email.
  We keep one focused pending-action state for per-row spinners and show the
  final result in a modal so confirmations stay visible after list refreshes.
*/
const closeRequestResultModal = (): void => {
  showRequestResultModal.value = false;
  requestResultTitle.value = "";
  requestResultDescription.value = "";
};

const setPendingRequestAction = (requestId: string, action: RequestDecisionAction): void => {
  pendingRequestAction.value = {
    requestId: String(requestId || ""),
    action,
  };
};

const clearPendingRequestAction = (): void => {
  pendingRequestAction.value = null;
};

const isPendingRequestAction = (requestId: string, action: RequestDecisionAction): boolean =>
  saving.value &&
  pendingRequestAction.value?.requestId === String(requestId || "") &&
  pendingRequestAction.value?.action === action;

const openRequestResultModal = (
  action: RequestDecisionAction,
  requestItem: AccessTokenRequestRecord
): void => {
  requestResultTitle.value =
    action === "approve"
      ? t("adminTokens.requestResult.approvedTitle")
      : t("adminTokens.requestResult.rejectedTitle");
  requestResultDescription.value =
    action === "approve"
      ? t("adminTokens.requestResult.approvedDescription", {
          alias: requestItem.alias,
          email: requestItem.email,
        })
      : t("adminTokens.requestResult.rejectedDescription", {
          alias: requestItem.alias,
          email: requestItem.email,
        });
  showRequestResultModal.value = true;
};

const clearSuperadminToken = (): void => {
  activeToken.value = "";
  tokenInput.value = "";
  sessionStorage.removeItem(SUPERADMIN_TOKEN_STORAGE_KEY);
  accessTokens.value = [];
  pendingRequests.value = [];
  availableServicePolicies.value = {};
  tokenTable.setPageIndex(0);
  listSearch.value = "";
  listStatusFilter.value = "all";
  listTypeFilter.value = "all";
  listSort.value = "createdAt:desc";
  globalFilter.value = "";
  sorting.value = [{ id: "createdAt", desc: true }];
  columnFilters.value = [];
  clearReveal();
  closeFormModal();
  closeHistoryModal();
  closeDetailsModal();
  closeRequestsModal();
  closeRequestResultModal();
  clearPendingRequestAction();
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
  setPendingRequestAction(requestItem.requestId, "approve");
  error.value = "";
  success.value = "";

  try {
    await approveTokenRequest(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      requestItem.requestId
    );
    openRequestResultModal("approve", requestItem);
    await loadAdminData();
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.approveRequest");
  } finally {
    clearPendingRequestAction();
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
  setPendingRequestAction(requestItem.requestId, "reject");
  error.value = "";
  success.value = "";

  try {
    await rejectTokenRequest(
      portalContext.apiBaseUrl.value,
      activeToken.value,
      requestItem.requestId,
      reason.trim()
    );
    openRequestResultModal("reject", requestItem);
    await loadAdminData();
  } catch (runError) {
    error.value =
      runError instanceof Error ? runError.message : t("adminTokens.errors.rejectRequest");
  } finally {
    clearPendingRequestAction();
    saving.value = false;
  }
};

const goToListPage = (nextPage: number): void => {
  tokenTable.setPageIndex(Math.max(0, Number(nextPage) - 1));
};

const goToFirstListPage = (): void => {
  tokenTable.setPageIndex(0);
};

const goToLastListPage = (): void => {
  tokenTable.setPageIndex(Math.max(0, listTotalPages.value - 1));
};

const updateListPageSize = (value: string): void => {
  tokenTable.setPageSize(Math.max(1, Number(value) || DEFAULT_LIST_PAGE_SIZE));
  tokenTable.setPageIndex(0);
};

const updateListPageSizeFromEvent = (event: Event): void => {
  updateListPageSize(String((event.target as HTMLSelectElement)?.value || DEFAULT_LIST_PAGE_SIZE));
};

/*
  Every toolbar control resets to page 1 so filtered results never land on an
  empty page after the user narrows the current dataset.
*/
const updateListSearchFromEvent = (event: Event): void => {
  listSearch.value = String((event.target as HTMLInputElement)?.value || "");
  globalFilter.value = listSearch.value;
  tokenTable.setPageIndex(0);
};

const updateListStatusFilterFromEvent = (event: Event): void => {
  listStatusFilter.value = String((event.target as HTMLSelectElement)?.value || "all") as
    | "all"
    | AdminTokenStatusKey;
  tokenTable
    .getColumn("status")
    ?.setFilterValue(listStatusFilter.value === "all" ? undefined : listStatusFilter.value);
  tokenTable.setPageIndex(0);
};

const updateListTypeFilterFromEvent = (event: Event): void => {
  listTypeFilter.value = String((event.target as HTMLSelectElement)?.value || "all");
  tokenTable
    .getColumn("tokenType")
    ?.setFilterValue(listTypeFilter.value === "all" ? undefined : listTypeFilter.value);
  tokenTable.setPageIndex(0);
};

const updateListSortFromEvent = (event: Event): void => {
  listSort.value = String((event.target as HTMLSelectElement)?.value || "createdAt:desc");
  const [sortBy, sortDirection] = listSort.value.split(":");
  sorting.value = [{ id: sortBy || "createdAt", desc: sortDirection !== "asc" }];
  tokenTable.setPageIndex(0);
};

const getListSortValue = (): string => listSort.value;

const getActionLabel = (action: TokenRowAction): string => {
  if (action === "details") {
    return t("adminTokens.detailsAction");
  }
  if (action === "history") {
    return t("adminTokens.history");
  }
  if (action === "resetUsage") {
    return t("adminTokens.resetUsageAction");
  }
  if (action === "edit") {
    return t("adminTokens.edit");
  }
  if (action === "revoke") {
    return t("adminTokens.revoke");
  }
  if (action === "renew") {
    return t("adminTokens.renew");
  }
  return t("adminTokens.extend");
};

const isTokenActionAllowed = (action: TokenRowAction, tokenItem: AccessTokenRecord): boolean => {
  if (action === "resetUsage") {
    return Boolean(tokenItem.isActive);
  }
  if (action === "revoke") {
    return !tokenItem.isRevoked;
  }
  if (action === "renew") {
    return Boolean(tokenItem.isRevoked || tokenItem.isExpired);
  }
  if (action === "extend") {
    return !tokenItem.isRevoked;
  }
  return true;
};

const getDisabledReason = (action: TokenRowAction): string => {
  if (action === "resetUsage") {
    return t("adminTokens.actionRules.resetUsage");
  }
  if (action === "revoke") {
    return t("adminTokens.actionRules.revoke");
  }
  if (action === "renew") {
    return t("adminTokens.actionRules.renew");
  }
  if (action === "extend") {
    return t("adminTokens.actionRules.extend");
  }
  return t("adminTokens.actionRules.notAvailable");
};

/*
  Action hover text now stays concise and uses native title tooltips so labels
  remain visible outside scroll containers without custom overlay clipping.
*/
const getActionTooltip = (action: TokenRowAction, tokenItem: AccessTokenRecord): string => {
  const label = getActionLabel(action);
  if (isTokenActionAllowed(action, tokenItem)) {
    return label;
  }
  return `${label} · ${t("adminTokens.actions.blocked")} (${getDisabledReason(action)})`;
};

const getActionButtonState = (action: TokenRowAction, tokenItem: AccessTokenRecord): string =>
  isTokenActionAllowed(action, tokenItem) ? "allowed" : "blocked";

/*
  Action tooltips are rendered in a fixed overlay so they appear immediately
  and never clip behind table boundaries or scroll containers.
*/
const floatingTooltip = ref({
  visible: false,
  text: "",
  x: 0,
  y: 0,
  placement: "top" as "top" | "bottom",
});

const showFloatingTooltip = (event: MouseEvent | FocusEvent, text: string): void => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target || !text) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const placement = rect.top > 56 ? "top" : "bottom";
  const pointerX =
    event instanceof MouseEvent ? event.clientX : Math.round(rect.left + rect.width / 2);
  const x = Math.max(12, Math.min(window.innerWidth - 12, pointerX));
  const y = placement === "top" ? rect.top - 10 : rect.bottom + 10;

  floatingTooltip.value = {
    visible: true,
    text,
    x,
    y,
    placement,
  };
};

const moveFloatingTooltip = (event: MouseEvent): void => {
  if (!floatingTooltip.value.visible) {
    return;
  }
  floatingTooltip.value.x = Math.max(12, Math.min(window.innerWidth - 12, event.clientX));
};

const hideFloatingTooltip = (): void => {
  floatingTooltip.value.visible = false;
};

const floatingTooltipStyle = computed(() => ({
  left: `${floatingTooltip.value.x}px`,
  top: `${floatingTooltip.value.y}px`,
  transform:
    floatingTooltip.value.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
}));

watch(accessTokens, () => {
  tokenTable.setPageIndex(0);
});

watch(sorting, () => {
  const primarySort = sorting.value[0];
  if (!primarySort?.id) {
    return;
  }

  listSort.value = `${primarySort.id}:${primarySort.desc ? "desc" : "asc"}`;
});

const copyTokenId = async (tokenId: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(String(tokenId || ""));
    success.value = t("adminTokens.success.copiedId");
  } catch {
    error.value = t("adminTokens.errors.copyTokenId");
  }
};

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
    <div class="section-head admin-head">
      <div>
        <h2 class="section-head__title">
          {{ t("adminTokens.title") }}
        </h2>
      </div>

      <article v-if="isAuthenticated" class="admin-request-banner">
        <button
          type="button"
          class="button button--icon admin-request-badge"
          :data-state="hasPendingRequests ? 'pending' : 'idle'"
          :disabled="loading || saving"
          :aria-label="requestBellAriaLabel"
          @click="openRequestsModal"
        >
          <span class="admin-request-badge__icon" aria-hidden="true">
            <AdminBellIconAsset :pending="hasPendingRequests" />
          </span>
          <span v-if="hasPendingRequests" class="admin-request-badge__count">
            {{ pendingRequestsCountLabel }}
          </span>
        </button>
        <button
          type="button"
          class="button button--secondary admin-head__logout"
          :disabled="loading || saving"
          @click="clearSuperadminToken"
        >
          {{ t("adminTokens.logout") }}
        </button>
      </article>
    </div>

    <article v-if="!isAuthenticated" class="tool-card admin-access admin-access--highlight">
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
      </div>
    </article>

    <p v-if="error && !showFormModal" class="tool-card__description tool-card__description--error">
      {{ error }}
    </p>
    <teleport to="body">
      <div
        v-if="floatingTooltip.visible"
        class="admin-floating-tooltip"
        :class="{ 'admin-floating-tooltip--bottom': floatingTooltip.placement === 'bottom' }"
        :style="floatingTooltipStyle"
        role="tooltip"
      >
        {{ floatingTooltip.text }}
      </div>
    </teleport>
    <p v-if="success" class="tool-card__description">{{ success }}</p>

    <article v-if="revealedToken && !isAuthenticated" class="tool-card admin-reveal">
      <h3 class="tool-card__title">{{ t("adminTokens.plaintextTitle") }}</h3>
      <p class="tool-card__description">
        {{ t("adminTokens.plaintextDescription", { label: revealedTokenLabel }) }}
      </p>
      <pre class="admin-reveal__token">{{ revealedToken }}</pre>
    </article>

    <article v-if="isAuthenticated" class="tool-card admin-list admin-list--full-width">
      <div class="admin-list__title-row">
        <div>
          <h3 class="tool-card__title">{{ t("adminTokens.accessTokens") }}</h3>
          <p class="tool-card__description">
            {{
              t("adminTokens.filteredSummary", {
                filtered: filteredTokensCount,
                total: accessTokens.length,
              })
            }}
          </p>
        </div>
      </div>

      <!--
        Toolbar controls stay local to the loaded dataset so filtering is fast,
        predictable, and independent from backend query parameter changes.
      -->
      <div class="admin-list__toolbar">
        <input
          :value="listSearch"
          type="search"
          class="field admin-list__search"
          :placeholder="t('adminTokens.searchPlaceholder')"
          :disabled="loading || saving"
          @input="updateListSearchFromEvent"
        />
        <select
          :value="listStatusFilter"
          class="rotation-select admin-list__control"
          :disabled="loading || saving"
          @change="updateListStatusFilterFromEvent"
        >
          <option value="all">{{ t("adminTokens.filters.allStatuses") }}</option>
          <option value="active">{{ t("adminTokens.active") }}</option>
          <option value="revoked">{{ t("adminTokens.revoked") }}</option>
          <option value="expired">{{ t("adminTokens.expired") }}</option>
        </select>
        <select
          :value="listTypeFilter"
          class="rotation-select admin-list__control"
          :disabled="loading || saving"
          @change="updateListTypeFilterFromEvent"
        >
          <option value="all">{{ t("adminTokens.filters.allTypes") }}</option>
          <option v-for="typeOption in listTypeOptions" :key="typeOption" :value="typeOption">
            {{ typeOption }}
          </option>
        </select>
        <select
          :value="getListSortValue()"
          class="rotation-select admin-list__control"
          :disabled="loading || saving"
          @change="updateListSortFromEvent"
        >
          <option value="createdAt:desc">{{ t("adminTokens.sortOptions.createdAtDesc") }}</option>
          <option value="createdAt:asc">{{ t("adminTokens.sortOptions.createdAtAsc") }}</option>
          <option value="alias:asc">{{ t("adminTokens.sortOptions.aliasAsc") }}</option>
          <option value="alias:desc">{{ t("adminTokens.sortOptions.aliasDesc") }}</option>
          <option value="expiresAt:asc">{{ t("adminTokens.sortOptions.expiresAsc") }}</option>
          <option value="expiresAt:desc">{{ t("adminTokens.sortOptions.expiresDesc") }}</option>
          <option value="status:asc">{{ t("adminTokens.sortOptions.statusAsc") }}</option>
          <option value="status:desc">{{ t("adminTokens.sortOptions.statusDesc") }}</option>
        </select>
        <select
          :value="String(tokenTable.getState().pagination.pageSize)"
          class="rotation-select admin-list__control"
          :disabled="loading || saving"
          @change="updateListPageSizeFromEvent"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
        <button
          type="button"
          class="button button--secondary"
          :disabled="loading || saving"
          @click="loadAdminData"
        >
          {{ loading ? t("adminTokens.refreshing") : t("adminTokens.refresh") }}
        </button>
        <button
          type="button"
          class="button button--primary"
          :disabled="loading || saving"
          @click="openCreateModal"
        >
          {{ t("adminTokens.createToken") }}
        </button>
      </div>

      <p v-if="loading" class="tool-card__description">
        {{ t("adminTokens.loadingList") }}
      </p>
      <p v-else-if="accessTokens.length === 0" class="tool-card__description">
        {{ t("adminTokens.noAccessTokens") }}
      </p>
      <p v-else-if="filteredTokensCount === 0" class="tool-card__description">
        {{ t("adminTokens.noFilteredTokens") }}
      </p>
      <template v-else>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <template v-for="headerGroup in tokenTable.getHeaderGroups()" :key="headerGroup.id">
                <tr>
                  <th v-for="header in headerGroup.headers" :key="header.id">
                    <template v-if="!header.isPlaceholder">
                      <button
                        v-if="header.column.getCanSort()"
                        type="button"
                        class="admin-table__head-button"
                        @click="header.column.toggleSorting()"
                      >
                        <FlexRender
                          :render="header.column.columnDef.header"
                          :props="header.getContext()"
                        />
                        <span class="admin-table__head-sort">
                          {{
                            header.column.getIsSorted() === "asc"
                              ? "↑"
                              : header.column.getIsSorted() === "desc"
                                ? "↓"
                                : "·"
                          }}
                        </span>
                      </button>
                      <FlexRender
                        v-else
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                    </template>
                  </th>
                </tr>
              </template>
            </thead>
            <tbody>
              <tr v-for="row in paginatedRows" :key="row.id">
                <td v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <template v-if="cell.column.id === 'alias'">
                    <strong class="admin-table__alias">{{
                      row.original.alias || t("adminTokens.notAvailable")
                    }}</strong>
                    <div class="admin-chip-row">
                      <span v-if="row.original.renewedAt" class="admin-chip">
                        {{ t("adminTokens.renewed") }} {{ formatDateTime(row.original.renewedAt) }}
                      </span>
                      <span v-if="row.original.extendedAt" class="admin-chip">
                        {{ t("adminTokens.extended") }}
                        {{ formatDateTime(row.original.extendedAt) }}
                      </span>
                    </div>
                  </template>
                  <template v-else-if="cell.column.id === 'tokenId'">
                    <div class="admin-table__id-cell">
                      <code
                        class="admin-table__mono admin-table__mono--ellipsis"
                        :title="String(row.original.tokenId || '')"
                        >{{ row.original.tokenId }}</code
                      >
                      <button
                        type="button"
                        class="button button--icon admin-icon-button admin-id-copy"
                        :data-tooltip="t('adminTokens.actions.copyId')"
                        :aria-label="t('adminTokens.actions.copyId')"
                        @mouseenter="showFloatingTooltip($event, t('adminTokens.actions.copyId'))"
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="showFloatingTooltip($event, t('adminTokens.actions.copyId'))"
                        @blur="hideFloatingTooltip"
                        @click="copyTokenId(String(row.original.tokenId || ''))"
                      >
                        <AdminActionIconAsset name="copy-id" />
                      </button>
                    </div>
                  </template>
                  <template v-else-if="cell.column.id === 'status'">
                    <span
                      class="admin-chip"
                      :class="{
                        'admin-chip--active': resolveTokenStatus(row.original) === 'active',
                        'admin-chip--revoked': resolveTokenStatus(row.original) === 'revoked',
                        'admin-chip--expired': resolveTokenStatus(row.original) === 'expired',
                      }"
                    >
                      {{ t(`adminTokens.${resolveTokenStatus(row.original)}`) }}
                    </span>
                  </template>
                  <template v-else-if="cell.column.id === 'expiresAt'">
                    <div class="admin-table__stack">
                      <span>{{ formatDateTime(row.original.expiresAt) }}</span>
                      <span v-if="row.original.usageResetAt" class="admin-table__muted">
                        {{ t("adminTokens.usageReset") }}:
                        {{ formatDateTime(row.original.usageResetAt) }}
                      </span>
                    </div>
                  </template>
                  <template v-else-if="cell.column.id === 'actions'">
                    <div class="admin-table__actions">
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('details', row.original)"
                        :data-state="getActionButtonState('details', row.original)"
                        :aria-label="t('adminTokens.detailsAction')"
                        :disabled="saving"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('details', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('details', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="openDetailsModal(row.original)"
                      >
                        <AdminActionIconAsset name="details" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('history', row.original)"
                        :data-state="getActionButtonState('history', row.original)"
                        :aria-label="t('adminTokens.history')"
                        :disabled="saving"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('history', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('history', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="openHistory(row.original)"
                      >
                        <AdminActionIconAsset name="history" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('resetUsage', row.original)"
                        :data-state="getActionButtonState('resetUsage', row.original)"
                        :aria-label="t('adminTokens.resetUsageAction')"
                        :disabled="saving || !isTokenActionAllowed('resetUsage', row.original)"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('resetUsage', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('resetUsage', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="runResetUsage(row.original)"
                      >
                        <AdminActionIconAsset name="reset-usage" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('edit', row.original)"
                        :data-state="getActionButtonState('edit', row.original)"
                        :aria-label="t('adminTokens.edit')"
                        :disabled="saving"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('edit', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="showFloatingTooltip($event, getActionTooltip('edit', row.original))"
                        @blur="hideFloatingTooltip"
                        @click="startEdit(row.original)"
                      >
                        <AdminActionIconAsset name="edit" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('revoke', row.original)"
                        :data-state="getActionButtonState('revoke', row.original)"
                        :aria-label="t('adminTokens.revoke')"
                        :disabled="saving || !isTokenActionAllowed('revoke', row.original)"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('revoke', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('revoke', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="runRevoke(row.original)"
                      >
                        <AdminActionIconAsset name="revoke" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('renew', row.original)"
                        :data-state="getActionButtonState('renew', row.original)"
                        :aria-label="t('adminTokens.renew')"
                        :disabled="saving || !isTokenActionAllowed('renew', row.original)"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('renew', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('renew', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="runRenew(row.original)"
                      >
                        <AdminActionIconAsset name="renew" />
                      </button>
                      <button
                        type="button"
                        class="button button--icon admin-icon-button"
                        :data-tooltip="getActionTooltip('extend', row.original)"
                        :data-state="getActionButtonState('extend', row.original)"
                        :aria-label="t('adminTokens.extend')"
                        :disabled="saving || !isTokenActionAllowed('extend', row.original)"
                        @mouseenter="
                          showFloatingTooltip($event, getActionTooltip('extend', row.original))
                        "
                        @mousemove="moveFloatingTooltip"
                        @mouseleave="hideFloatingTooltip"
                        @focus="
                          showFloatingTooltip($event, getActionTooltip('extend', row.original))
                        "
                        @blur="hideFloatingTooltip"
                        @click="runExtend(row.original)"
                      >
                        <AdminActionIconAsset name="extend" />
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <span class="admin-table__cell-value">
                      {{ String(cell.getValue() || t("adminTokens.notAvailable")) }}
                    </span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="admin-pagination">
          <span class="admin-pagination__summary">
            {{
              t("adminTokens.pagination.filtered", {
                filtered: filteredTokensCount,
                total: accessTokens.length,
              })
            }}
          </span>
          <button
            type="button"
            class="rotation-select admin-pagination__button"
            :disabled="!listCanGoPrev"
            @click="goToFirstListPage"
          >
            {{ t("adminTokens.pagination.first") }}
          </button>
          <button
            type="button"
            class="rotation-select admin-pagination__button"
            :disabled="!listCanGoNext"
            @click="goToListPage(listCurrentPage - 1)"
          >
            {{ t("adminTokens.pagination.previous") }}
          </button>
          <div class="admin-pagination__pages" :aria-label="t('adminTokens.pagination.pagesAria')">
            <button
              v-for="pageNumber in visiblePageNumbers"
              :key="pageNumber"
              type="button"
              class="rotation-select admin-pagination__page"
              :class="{ 'admin-pagination__page--active': pageNumber === listCurrentPage }"
              :disabled="pageNumber === listCurrentPage"
              @click="goToListPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>
          </div>
          <button
            type="button"
            class="rotation-select admin-pagination__button"
            :disabled="!listCanGoNext"
            @click="goToListPage(listCurrentPage + 1)"
          >
            {{ t("adminTokens.pagination.next") }}
          </button>
          <button
            type="button"
            class="rotation-select admin-pagination__button"
            :disabled="!listCanGoNext"
            @click="goToLastListPage"
          >
            {{ t("adminTokens.pagination.last") }}
          </button>
        </div>
      </template>
    </article>

    <div
      v-if="showRequestsModal"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('adminTokens.requestNotifications')"
      @click.self="closeRequestsModal"
    >
      <article class="admin-modal__card admin-modal__card--requests">
        <div class="admin-modal__head">
          <div>
            <h3 class="tool-card__title">{{ t("adminTokens.requestNotifications") }}</h3>
            <p class="tool-card__description">
              {{ t("adminTokens.requestNotificationsSubtitle") }}
            </p>
          </div>
          <button type="button" class="button button--secondary" @click="closeRequestsModal">
            {{ t("modal.close") }}
          </button>
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
              <article v-if="requestItem.pricing" class="admin-meta-item">
                <span class="admin-meta-item__label">{{ t("adminTokens.pricing.total") }}</span>
                <strong class="admin-meta-item__value">
                  {{ formatMoney(requestItem.pricing.totalAmount, requestItem.pricing.currency) }}
                </strong>
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
                  <strong>{{ formatServiceLabel(serviceKey) }}</strong>
                  <span>{{ formatPresetLabel(preset) }}</span>
                </span>
              </div>
            </div>

            <div v-if="requestItem.pricing?.items?.length" class="admin-token-list__block">
              <p class="admin-token-list__block-title">{{ t("adminTokens.pricing.breakdown") }}</p>
              <div class="admin-token-list__tags">
                <span
                  v-for="pricingItem in requestItem.pricing.items"
                  :key="`${requestItem.requestId}-pricing-${pricingItem.serviceKey}`"
                  class="admin-token-list__tag"
                >
                  <strong>{{ formatServiceLabel(pricingItem.serviceKey) }}</strong>
                  <span>
                    {{ formatPresetLabel(pricingItem.preset) }} ·
                    {{ formatMoney(pricingItem.amount, pricingItem.currency) }}
                  </span>
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
                <span class="admin-action-button__content">
                  <span
                    v-if="isPendingRequestAction(requestItem.requestId, 'approve')"
                    class="admin-action-button__spinner"
                    aria-hidden="true"
                  ></span>
                  <span>{{
                    isPendingRequestAction(requestItem.requestId, "approve")
                      ? t("adminTokens.sendingEmail")
                      : t("adminTokens.approveRequest")
                  }}</span>
                </span>
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving"
                @click="runRejectRequest(requestItem)"
              >
                <span class="admin-action-button__content">
                  <span
                    v-if="isPendingRequestAction(requestItem.requestId, 'reject')"
                    class="admin-action-button__spinner"
                    aria-hidden="true"
                  ></span>
                  <span>{{
                    isPendingRequestAction(requestItem.requestId, "reject")
                      ? t("adminTokens.sendingEmail")
                      : t("adminTokens.rejectRequest")
                  }}</span>
                </span>
              </button>
            </div>
          </li>
        </ul>
      </article>
    </div>

    <div
      v-if="showDetailsModal"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('adminTokens.detailsTitle')"
      @click.self="closeDetailsModal"
    >
      <article class="admin-modal__card admin-modal__card--details">
        <div class="admin-modal__head">
          <div>
            <h3 class="tool-card__title">{{ t("adminTokens.detailsTitle") }}</h3>
            <p class="tool-card__description">
              {{
                t("adminTokens.detailsDescription", {
                  label:
                    detailsToken?.alias || detailsToken?.tokenId || t("adminTokens.notAvailable"),
                })
              }}
            </p>
          </div>
          <button type="button" class="button button--secondary" @click="closeDetailsModal">
            {{ t("modal.close") }}
          </button>
        </div>

        <div class="admin-details-grid">
          <article class="tool-card admin-details-card">
            <h4 class="tool-card__title">{{ t("adminTokens.policies") }}</h4>
            <p v-if="detailsPolicyEntries.length === 0" class="tool-card__description">
              {{ t("adminTokens.none") }}
            </p>
            <div v-else class="admin-token-list__tags">
              <span
                v-for="[serviceKey, preset] in detailsPolicyEntries"
                :key="`details-policy-${serviceKey}`"
                class="admin-token-list__tag"
              >
                <strong>{{ formatServiceLabel(serviceKey) }}</strong>
                <span>{{ formatPresetLabel(preset) }}</span>
              </span>
            </div>
          </article>

          <article class="tool-card admin-details-card">
            <h4 class="tool-card__title">{{ t("adminTokens.usageLabel") }}</h4>
            <p v-if="detailsUsageEntries.length === 0" class="tool-card__description">
              {{ t("adminTokens.usage.unlimited") }}
            </p>
            <div v-else class="admin-details-usage-list">
              <article
                v-for="usageItem in detailsUsageEntries"
                :key="`details-usage-${usageItem.serviceKey}`"
                class="admin-details-usage-item"
              >
                <strong>{{ formatServiceLabel(usageItem.serviceKey) }}</strong>
                <span>
                  {{ t("adminTokens.columns.requests") }}:
                  {{
                    usageItem.quota?.requests?.limit === null ||
                    usageItem.quota?.requests?.limit === undefined
                      ? t("adminTokens.usage.unlimited")
                      : `${formatNumber(usageItem.quota?.requests?.used)} / ${formatNumber(usageItem.quota?.requests?.limit)}`
                  }}
                </span>
                <span>
                  {{ t("adminTokens.columns.words") }}:
                  {{
                    usageItem.quota?.words?.limit === null ||
                    usageItem.quota?.words?.limit === undefined
                      ? t("adminTokens.usage.unlimited")
                      : `${formatNumber(usageItem.quota?.words?.used)} / ${formatNumber(usageItem.quota?.words?.limit)} (${t("adminTokens.usage.remaining", { remaining: formatNumber(usageItem.quota?.words?.remaining) })})`
                  }}
                </span>
              </article>
            </div>
          </article>

          <article class="tool-card admin-details-card">
            <h4 class="tool-card__title">{{ t("adminTokens.pricing.title") }}</h4>
            <p v-if="!detailsToken?.pricing" class="tool-card__description">
              {{ t("adminTokens.notAvailable") }}
            </p>
            <div v-else class="admin-details-usage-list">
              <article class="admin-details-usage-item">
                <strong>{{ t("adminTokens.pricing.total") }}</strong>
                <span>
                  {{ formatMoney(detailsToken.pricing.totalAmount, detailsToken.pricing.currency) }}
                </span>
              </article>
              <article
                v-for="pricingItem in detailsPricingEntries"
                :key="`details-pricing-${pricingItem.serviceKey}`"
                class="admin-details-usage-item"
              >
                <strong>{{ formatServiceLabel(pricingItem.serviceKey) }}</strong>
                <span>{{ formatPresetLabel(pricingItem.preset) }}</span>
                <span>{{ formatMoney(pricingItem.amount, pricingItem.currency) }}</span>
              </article>
            </div>
          </article>
        </div>
      </article>
    </div>

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
                <span>{{ formatServiceLabel(serviceKey) }}</span>
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

    <div
      v-if="showRequestResultModal"
      class="admin-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="requestResultTitle || t('adminTokens.requestResult.ariaLabel')"
      @click.self="closeRequestResultModal"
    >
      <article class="admin-modal__card admin-modal__card--result">
        <p class="admin-result-modal__kicker">{{ t("adminTokens.requestResult.kicker") }}</p>
        <h3 class="tool-card__title">{{ requestResultTitle }}</h3>
        <p class="tool-card__description">{{ requestResultDescription }}</p>
        <div class="preview-card__actions">
          <button type="button" class="button button--primary" @click="closeRequestResultModal">
            {{ t("modal.close") }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style src="./AdminTokensView.scss" lang="scss"></style>
