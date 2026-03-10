<script setup>
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

const portalContext = inject("portalContext");
const { locale, t } = usePortalI18n();
const SUPERADMIN_TOKEN_STORAGE_KEY = "admin_tokens_superadmin_token";
const DEFAULT_TTL = "30d";
const formatDateTime = (value, fallbackKey = "adminTokens.notAvailable") =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : t(fallbackKey);

const tokenInput = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const activeToken = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const accessTokens = ref([]);
const availableServicePolicies = ref({});
const revealedToken = ref("");
const revealedTokenLabel = ref("");
const editingTokenId = ref("");
const buildEmptyPolicies = () => ({
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

const normalizeSelectedPolicies = (policies) =>
  Object.fromEntries(
    Object.entries(policies || {}).filter(([, preset]) => String(preset || "").trim())
  );

/*
  Usage summaries must distinguish consumed versus remaining quota, otherwise
  word-based plans can look healthy while the backend has already exhausted them.
*/
const formatUsageSummary = (serviceItem) => {
  const requestQuota = serviceItem?.quota?.requests;
  const wordQuota = serviceItem?.quota?.words;
  const parts = [];

  if (requestQuota?.limit !== null) {
    parts.push(
      t("adminTokens.usage.requestsUsed", {
        used: requestQuota.used,
        limit: requestQuota.limit,
      })
    );
  }

  if (wordQuota?.limit !== null) {
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
const listPolicyEntries = (tokenItem) =>
  tokenItem?.servicePolicies && Object.keys(tokenItem.servicePolicies).length > 0
    ? Object.entries(tokenItem.servicePolicies)
    : [];

const listUsageEntries = (tokenItem) =>
  Array.isArray(tokenItem?.usageSummary) && tokenItem.usageSummary.length > 0
    ? tokenItem.usageSummary
    : [];

const resetForm = () => {
  editingTokenId.value = "";
  form.value = {
    alias: "",
    ttl: DEFAULT_TTL,
    servicePolicies: buildEmptyPolicies(),
  };
};

const clearReveal = () => {
  revealedToken.value = "";
  revealedTokenLabel.value = "";
};

const clearSuperadminToken = () => {
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

const loadTokens = async () => {
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
        ? data.availableServicePolicies
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

const authenticate = async () => {
  const nextToken = tokenInput.value.trim();
  if (!nextToken) {
    error.value = t("adminTokens.errors.enterSuperadminFirst");
    return;
  }

  activeToken.value = nextToken;
  sessionStorage.setItem(SUPERADMIN_TOKEN_STORAGE_KEY, nextToken);
  await loadTokens();
};

const startEdit = (tokenItem) => {
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

const submitForm = async () => {
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

const runRevoke = async (tokenItem) => {
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

const promptTtl = (titleKey, params = {}) => {
  const nextValue = window.prompt(t(titleKey, params), DEFAULT_TTL);
  return nextValue ? nextValue.trim() : "";
};

const runRenew = async (tokenItem) => {
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
    revealedTokenLabel.value = result?.record?.alias || tokenItem.alias;
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

const runExtend = async (tokenItem) => {
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

const runResetUsage = async (tokenItem) => {
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

<style scoped>
/*
  The token manager keeps authentication, token creation, and token catalog
  actions on one screen so superadmins can operate without extra route hops.
*/
.admin-access,
.admin-list,
.admin-detail,
.admin-reveal {
  color: var(--ink);
  background: var(--surface);
}

.admin-access .tool-card__title,
.admin-list .tool-card__title,
.admin-detail .tool-card__title,
.admin-reveal .tool-card__title {
  color: var(--ink);
}

.admin-access .tool-card__description,
.admin-list .tool-card__description,
.admin-detail .tool-card__description,
.admin-reveal .tool-card__description {
  color: var(--ink-soft);
}

.admin-list .tool-card__description--error,
.admin-detail .tool-card__description--error,
.admin-access .tool-card__description--error,
.admin-reveal .tool-card__description--error {
  color: var(--error);
}

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
  color: var(--ink);
}

.field:focus {
  outline: 2px solid rgba(13, 148, 136, 0.26);
  outline-offset: 1px;
}

.admin-layout {
  display: grid;
  grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr);
  gap: 1rem;
}

.admin-form {
  display: grid;
  gap: 0.9rem;
}

.admin-form__field {
  display: grid;
  gap: 0.45rem;
  color: var(--ink-soft);
}

.admin-form__field > span {
  color: var(--ink);
  font-weight: 700;
}

.admin-policy-grid {
  display: grid;
  gap: 0.55rem;
}

.admin-token-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.admin-token-list__item {
  display: grid;
  gap: 0.95rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
}

.admin-token-list__head {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.admin-token-list__alias {
  font-size: 1rem;
  line-height: 1.3;
  color: var(--ink);
}

.admin-token-list__meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.6rem;
}

/*
  Metadata values are grouped into compact cards so admins can scan token type,
  id, expiration, and reset timestamps without parsing long sentence lines.
*/
.admin-meta-item {
  display: grid;
  gap: 0.22rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0.78rem;
  padding: 0.55rem 0.65rem;
  background: rgba(255, 255, 255, 0.88);
}

.admin-meta-item__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #0f766e;
}

.admin-meta-item__value {
  font-size: 0.88rem;
  color: var(--ink);
}

.admin-meta-item__value--mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

.admin-token-list__block {
  display: grid;
  gap: 0.5rem;
}

.admin-token-list__block-title {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #155e75;
}

.admin-token-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.admin-token-list__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid rgba(13, 148, 136, 0.28);
  border-radius: 999px;
  padding: 0.2rem 0.56rem;
  background: rgba(20, 184, 166, 0.1);
  font-size: 0.78rem;
  color: #134e4a;
}

.admin-token-list__usage-grid {
  display: grid;
  gap: 0.45rem;
}

.admin-usage-item {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0.78rem;
  padding: 0.5rem 0.62rem;
  background: rgba(255, 255, 255, 0.92);
  font-size: 0.84rem;
  color: var(--ink-soft);
}

.admin-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
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

.admin-chip--active {
  border-color: #99f6e4;
  background: #ccfbf1;
  color: #115e59;
}

.admin-chip--revoked {
  border-color: #fecaca;
  background: #fee2e2;
  color: #991b1b;
}

.admin-chip--expired {
  border-color: #fde68a;
  background: #fef3c7;
  color: #92400e;
}

.admin-reveal__token {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 0.95rem;
  background: rgba(15, 23, 42, 0.05);
  color: var(--ink);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .admin-access__row {
    grid-template-columns: 1fr;
  }

  .admin-token-list__meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
