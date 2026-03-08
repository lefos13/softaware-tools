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
  renewAccessToken,
  revokeAccessToken,
  updateAccessToken,
} from "../services/adminTokenService";

const portalContext = inject("portalContext");
const { locale } = usePortalI18n();
const SUPERADMIN_TOKEN_STORAGE_KEY = "admin_tokens_superadmin_token";
const DEFAULT_TTL = "30d";
const tr = (en, el) => (locale.value === "el" ? el : en);
const formatDateTime = (value, fallbackEn = "n/a", fallbackEl = "δ/υ") =>
  value
    ? new Date(value).toLocaleString(locale.value === "el" ? "el-GR" : "en-US")
    : tr(fallbackEn, fallbackEl);

const tokenInput = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const activeToken = ref(sessionStorage.getItem(SUPERADMIN_TOKEN_STORAGE_KEY) || "");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const accessTokens = ref([]);
const availableServiceFlags = ref([]);
const revealedToken = ref("");
const revealedTokenLabel = ref("");
const editingTokenId = ref("");
const form = ref({
  alias: "",
  ttl: DEFAULT_TTL,
  serviceFlags: [],
});

const isAuthenticated = computed(() => Boolean(activeToken.value));
const isEditing = computed(() => Boolean(editingTokenId.value));
const sortedServiceFlags = computed(() => [...availableServiceFlags.value].sort());

const resetForm = () => {
  editingTokenId.value = "";
  form.value = {
    alias: "",
    ttl: DEFAULT_TTL,
    serviceFlags: [],
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
  availableServiceFlags.value = [];
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
    availableServiceFlags.value = Array.isArray(data.availableServiceFlags)
      ? data.availableServiceFlags
      : [];
  } catch (loadError) {
    const message =
      loadError instanceof Error
        ? loadError.message
        : tr("Could not load access tokens.", "Δεν ήταν δυνατή η φόρτωση των access tokens.");
    clearSuperadminToken();
    error.value = message;
  } finally {
    loading.value = false;
  }
};

const authenticate = async () => {
  const nextToken = tokenInput.value.trim();
  if (!nextToken) {
    error.value = tr("Enter a superadmin token first.", "Συμπληρώστε πρώτα ένα superadmin token.");
    return;
  }

  activeToken.value = nextToken;
  sessionStorage.setItem(SUPERADMIN_TOKEN_STORAGE_KEY, nextToken);
  await loadTokens();
};

const toggleServiceFlag = (serviceFlag) => {
  const nextFlags = new Set(form.value.serviceFlags);
  if (nextFlags.has(serviceFlag)) {
    nextFlags.delete(serviceFlag);
  } else {
    nextFlags.add(serviceFlag);
  }

  form.value = {
    ...form.value,
    serviceFlags: Array.from(nextFlags),
  };
};

const startEdit = (tokenItem) => {
  editingTokenId.value = tokenItem.tokenId;
  form.value = {
    alias: tokenItem.alias || "",
    ttl: DEFAULT_TTL,
    serviceFlags: Array.isArray(tokenItem.serviceFlags) ? [...tokenItem.serviceFlags] : [],
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
          serviceFlags: form.value.serviceFlags,
        }
      );

      success.value = tr("Access token updated.", "Το access token ενημερώθηκε.");
      accessTokens.value = accessTokens.value.map((tokenItem) =>
        tokenItem.tokenId === result?.record?.tokenId ? result.record : tokenItem
      );
      resetForm();
      return;
    }

    const result = await createAccessToken(portalContext.apiBaseUrl.value, activeToken.value, {
      alias: form.value.alias,
      serviceFlags: form.value.serviceFlags,
      ttl: form.value.ttl || DEFAULT_TTL,
    });

    success.value = tr("Access token created.", "Το access token δημιουργήθηκε.");
    revealedToken.value = result?.token || "";
    revealedTokenLabel.value = form.value.alias;
    resetForm();
    await loadTokens();
  } catch (runError) {
    error.value =
      runError instanceof Error
        ? runError.message
        : tr("Could not save the token.", "Δεν ήταν δυνατή η αποθήκευση του token.");
  } finally {
    saving.value = false;
  }
};

const runRevoke = async (tokenItem) => {
  if (!activeToken.value) {
    return;
  }

  const accepted = window.confirm(
    tr(`Revoke token "${tokenItem.alias}" now?`, `Να ανακληθεί τώρα το token "${tokenItem.alias}";`)
  );
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
    success.value = tr("Access token revoked.", "Το access token ανακλήθηκε.");
  } catch (runError) {
    error.value =
      runError instanceof Error
        ? runError.message
        : tr("Could not revoke the token.", "Δεν ήταν δυνατή η ανάκληση του token.");
  } finally {
    saving.value = false;
  }
};

const promptTtl = (titleEn, titleEl) => {
  const nextValue = window.prompt(tr(titleEn, titleEl), DEFAULT_TTL);
  return nextValue ? nextValue.trim() : "";
};

const runRenew = async (tokenItem) => {
  if (!activeToken.value) {
    return;
  }

  const ttl = promptTtl(
    `Renew "${tokenItem.alias}" for how long?`,
    `Για πόσο να ανανεωθεί το "${tokenItem.alias}";`
  );
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
      ttl
    );
    revealedToken.value = result?.token || "";
    revealedTokenLabel.value = result?.record?.alias || tokenItem.alias;
    accessTokens.value = accessTokens.value.map((item) =>
      item.tokenId === result?.record?.tokenId ? result.record : item
    );
    success.value = tr("Access token renewed.", "Το access token ανανεώθηκε.");
  } catch (runError) {
    error.value =
      runError instanceof Error
        ? runError.message
        : tr("Could not renew the token.", "Δεν ήταν δυνατή η ανανέωση του token.");
  } finally {
    saving.value = false;
  }
};

const runExtend = async (tokenItem) => {
  if (!activeToken.value) {
    return;
  }

  const ttl = promptTtl(
    `Extend "${tokenItem.alias}" by how much?`,
    `Κατά πόσο να επεκταθεί το "${tokenItem.alias}";`
  );
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
    success.value = tr("Access token extended.", "Το access token επεκτάθηκε.");
  } catch (runError) {
    error.value =
      runError instanceof Error
        ? runError.message
        : tr("Could not extend the token.", "Δεν ήταν δυνατή η επέκταση του token.");
  } finally {
    saving.value = false;
  }
};

if (activeToken.value) {
  void loadTokens();
}
</script>

<template>
  <section class="flow-view" aria-label="Admin tokens">
    <div class="section-head section-head--spaced admin-head">
      <div>
        <p class="admin-kicker">{{ tr("Restricted Area", "Περιορισμένη πρόσβαση") }}</p>
        <h2 class="section-head__title">
          {{ tr("Superadmin Token Management", "Διαχείριση tokens superadmin") }}
        </h2>
        <p class="section-head__subtitle">
          {{
            tr(
              "Use a CLI-created superadmin token to manage access tokens for protected services.",
              "Χρησιμοποιήστε superadmin token από το CLI για να διαχειριστείτε access tokens για προστατευμένες υπηρεσίες."
            )
          }}
        </p>
      </div>
      <button
        v-if="isAuthenticated"
        type="button"
        class="button button--secondary"
        :disabled="loading || saving"
        @click="loadTokens"
      >
        {{ loading ? tr("Refreshing...", "Ανανέωση...") : tr("Refresh", "Ανανέωση") }}
      </button>
    </div>

    <article class="tool-card admin-access admin-access--highlight">
      <h3 class="tool-card__title">{{ tr("Superadmin Session", "Συνεδρία superadmin") }}</h3>
      <p class="tool-card__description">
        {{
          tr(
            "Only CLI-created superadmin tokens can open this screen.",
            "Μόνο superadmin tokens που δημιουργούνται από το CLI μπορούν να ανοίξουν αυτή την οθόνη."
          )
        }}
      </p>
      <div class="admin-access__row">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          :placeholder="tr('Enter superadmin token', 'Συμπληρώστε superadmin token')"
          autocomplete="off"
        />
        <button
          type="button"
          class="button button--primary"
          :disabled="loading || saving"
          @click="authenticate"
        >
          {{ tr("Enter", "Είσοδος") }}
        </button>
        <button
          v-if="isAuthenticated"
          type="button"
          class="button button--secondary"
          :disabled="loading || saving"
          @click="clearSuperadminToken"
        >
          {{ tr("Clear", "Καθαρισμός") }}
        </button>
      </div>
    </article>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    <p v-if="success" class="tool-card__description">{{ success }}</p>

    <article v-if="revealedToken" class="tool-card admin-reveal">
      <h3 class="tool-card__title">{{ tr("Plaintext Token", "Token απλού κειμένου") }}</h3>
      <p class="tool-card__description">
        {{
          tr(
            `Store this token for "${revealedTokenLabel}" now. It is shown only once after create or renew.`,
            `Αποθηκεύστε τώρα το token για "${revealedTokenLabel}". Εμφανίζεται μόνο μία φορά μετά από δημιουργία ή ανανέωση.`
          )
        }}
      </p>
      <pre class="admin-reveal__token">{{ revealedToken }}</pre>
    </article>

    <div v-if="isAuthenticated" class="admin-layout">
      <article class="tool-card admin-list">
        <h3 class="tool-card__title">
          {{
            isEditing
              ? tr("Edit Access Token", "Επεξεργασία access token")
              : tr("Create Access Token", "Δημιουργία access token")
          }}
        </h3>
        <div class="admin-form">
          <label class="admin-form__field">
            <span>{{ tr("Alias", "Alias") }}</span>
            <input
              v-model="form.alias"
              type="text"
              class="field"
              :disabled="saving"
              :placeholder="tr('Example: Books editor client', 'Παράδειγμα: Books editor client')"
            />
          </label>

          <label v-if="!isEditing" class="admin-form__field">
            <span>{{ tr("TTL", "TTL") }}</span>
            <input
              v-model="form.ttl"
              type="text"
              class="field"
              :disabled="saving"
              :placeholder="DEFAULT_TTL"
            />
          </label>

          <div class="admin-form__field">
            <span>{{ tr("Service Flags", "Service Flags") }}</span>
            <div class="admin-flags">
              <label
                v-for="serviceFlag in sortedServiceFlags"
                :key="serviceFlag"
                class="checkbox-row admin-flags__item"
              >
                <input
                  type="checkbox"
                  :checked="form.serviceFlags.includes(serviceFlag)"
                  :disabled="saving"
                  @change="toggleServiceFlag(serviceFlag)"
                />
                <span>{{ serviceFlag }}</span>
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
                  ? tr("Saving...", "Αποθήκευση...")
                  : isEditing
                    ? tr("Save changes", "Αποθήκευση αλλαγών")
                    : tr("Create token", "Δημιουργία token")
              }}
            </button>
            <button
              type="button"
              class="button button--secondary"
              :disabled="saving"
              @click="resetForm"
            >
              {{ tr("Reset", "Επαναφορά") }}
            </button>
          </div>
        </div>
      </article>

      <article class="tool-card admin-detail">
        <h3 class="tool-card__title">{{ tr("Access Tokens", "Access tokens") }}</h3>
        <p class="tool-card__description">{{ tr("Total", "Σύνολο") }}: {{ accessTokens.length }}</p>

        <p v-if="!loading && accessTokens.length === 0" class="tool-card__description">
          {{ tr("No access tokens found.", "Δεν βρέθηκαν access tokens.") }}
        </p>

        <ul v-else class="admin-token-list" role="list">
          <li
            v-for="tokenItem in accessTokens"
            :key="tokenItem.tokenId"
            class="admin-token-list__item"
          >
            <div class="admin-token-list__meta">
              <strong>{{ tokenItem.alias }}</strong>
              <span>{{ tr("Type", "Τύπος") }}: {{ tokenItem.tokenType }}</span>
              <span>id {{ tokenItem.tokenId }}</span>
              <span>{{ tr("Expires", "Λήγει") }}: {{ formatDateTime(tokenItem.expiresAt) }}</span>
              <span>
                {{ tr("Flags", "Flags") }}:
                {{
                  Array.isArray(tokenItem.serviceFlags) && tokenItem.serviceFlags.length > 0
                    ? tokenItem.serviceFlags.join(", ")
                    : tr("none", "κανένα")
                }}
              </span>
            </div>

            <div class="admin-chip-row">
              <span v-if="tokenItem.isActive" class="admin-chip">{{ tr("Active", "Ενεργό") }}</span>
              <span v-else-if="tokenItem.isRevoked" class="admin-chip">{{
                tr("Revoked", "Ανακλήθηκε")
              }}</span>
              <span v-else-if="tokenItem.isExpired" class="admin-chip">{{
                tr("Expired", "Έληξε")
              }}</span>
              <span v-if="tokenItem.renewedAt" class="admin-chip">
                {{ tr("Renewed", "Ανανεώθηκε") }} {{ formatDateTime(tokenItem.renewedAt) }}
              </span>
              <span v-if="tokenItem.extendedAt" class="admin-chip">
                {{ tr("Extended", "Επεκτάθηκε") }} {{ formatDateTime(tokenItem.extendedAt) }}
              </span>
            </div>

            <div class="preview-card__actions">
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving"
                @click="startEdit(tokenItem)"
              >
                {{ tr("Edit", "Επεξεργασία") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || tokenItem.isRevoked"
                @click="runRevoke(tokenItem)"
              >
                {{ tr("Revoke", "Ανάκληση") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || (!tokenItem.isRevoked && !tokenItem.isExpired)"
                @click="runRenew(tokenItem)"
              >
                {{ tr("Renew", "Ανανέωση") }}
              </button>
              <button
                type="button"
                class="button button--secondary"
                :disabled="saving || tokenItem.isRevoked"
                @click="runExtend(tokenItem)"
              >
                {{ tr("Extend", "Επέκταση") }}
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

.admin-flags {
  display: grid;
  gap: 0.55rem;
}

.admin-flags__item {
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  background: #ffffff;
  color: var(--ink);
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
  gap: 0.8rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--border);
  border-radius: 0.95rem;
  background: #ffffff;
}

.admin-token-list__meta {
  display: grid;
  gap: 0.2rem;
  font-size: 0.92rem;
  color: var(--ink-soft);
}

.admin-token-list__meta strong {
  color: var(--ink);
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
}
</style>
