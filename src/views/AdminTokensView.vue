<script setup lang="ts">
/*
  The superadmin screen is now dedicated to access-token lifecycle management
  so browser admins can create, edit, revoke, renew, and extend service tokens
  without mixing that workflow with failure-report browsing.
*/
import { computed, inject, ref } from "vue";
import { usePortalI18n } from "../i18n";
import {
  createAccessToken,
  extendAccessToken,
  listAccessTokens,
  resetAccessTokenUsage,
  renewAccessToken,
  revokeAccessToken,
  updateAccessToken,
} from "../services/adminTokenService";
import type { PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";
import type { AccessTokenRecord } from "../types/services";

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
const formatDateTime = (value?: string, fallbackKey = "adminTokens.notAvailable"): string =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const tokenInput = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const activeToken = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const accessTokens = ref<AccessTokenRecord[]>([]);
const availableServicePolicies = ref<AdminPolicyPresetMap>({});
const revealedToken = ref("");
const revealedTokenLabel = ref("");
const editingTokenId = ref("");
const buildEmptyPolicies = (): AdminServicePoliciesForm => ({
  books_greek_editor: "",
  image: "",
  pdf: "",
  tasks: "",
});
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

/*
  Token rows expose many independent fields, so these helpers normalize policy
  and usage blocks into arrays for structured card rendering in the template.
*/
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

const clearSuperadminToken = (): void => {
  activeToken.value = "";
  tokenInput.value = "";
  sessionStorage.removeItem(SUPERADMIN_TOKEN_STORAGE_KEY);
  accessTokens.value = [];
  availableServicePolicies.value = {};
  clearReveal();
  resetForm();
  error.value = "";
  success.value = "";
};

const loadTokens = async (): Promise<void> => {
  if (!activeToken.value) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
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
  } catch (loadError) {
    const message =
      loadError instanceof Error ? loadError.message : t("adminTokens.errors.loadTokens");
    clearSuperadminToken();
    error.value = message;
  } finally {
    loading.value = false;
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
  await loadTokens();
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

      success.value = t("adminTokens.success.updated");
      accessTokens.value = accessTokens.value.map((tokenItem) =>
        tokenItem.tokenId === result?.record?.tokenId ? result.record : tokenItem
      );
      resetForm();
      return;
    }

    const result = await createAccessToken(portalContext.apiBaseUrl.value, activeToken.value, {
      alias: form.value.alias,
      servicePolicies: normalizeSelectedPolicies(form.value.servicePolicies),
      ttl: form.value.ttl || DEFAULT_TTL,
    });

    success.value = t("adminTokens.success.created");
    revealedToken.value = result?.token || "";
    revealedTokenLabel.value = form.value.alias;
    resetForm();
    await loadTokens();
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
    accessTokens.value = accessTokens.value.map((item) =>
      item.tokenId === result?.record?.tokenId ? result.record : item
    );
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
    accessTokens.value = accessTokens.value.map((item) =>
      item.tokenId === result?.record?.tokenId ? result.record : item
    );
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
    accessTokens.value = accessTokens.value.map((item) =>
      item.tokenId === result?.record?.tokenId ? result.record : item
    );
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
    await loadTokens();
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : t("adminTokens.errors.resetUsage");
  } finally {
    saving.value = false;
  }
};

if (activeToken.value) {
  void loadTokens();
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
        @click="loadTokens"
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

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    <p v-if="success" class="tool-card__description">{{ success }}</p>

    <article v-if="revealedToken" class="tool-card admin-reveal">
      <h3 class="tool-card__title">{{ t("adminTokens.plaintextTitle") }}</h3>
      <p class="tool-card__description">
        {{ t("adminTokens.plaintextDescription", { label: revealedTokenLabel }) }}
      </p>
      <pre class="admin-reveal__token">{{ revealedToken }}</pre>
    </article>

    <div v-if="isAuthenticated" class="admin-layout">
      <article class="tool-card admin-list">
        <h3 class="tool-card__title">
          {{ isEditing ? t("adminTokens.editAccessToken") : t("adminTokens.createAccessToken") }}
        </h3>
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

      <article class="tool-card admin-detail">
        <h3 class="tool-card__title">{{ t("adminTokens.accessTokens") }}</h3>
        <p class="tool-card__description">
          {{ t("adminTokens.total") }}: {{ accessTokens.length }}
        </p>

        <p v-if="!loading && accessTokens.length === 0" class="tool-card__description">
          {{ t("adminTokens.noAccessTokens") }}
        </p>

        <ul v-else class="admin-token-list" role="list">
          <li
            v-for="tokenItem in accessTokens"
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
      </article>
    </div>
  </section>
</template>

<style src="./AdminTokensView.scss" lang="scss"></style>
