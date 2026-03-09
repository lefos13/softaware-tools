<script setup>
/*
  The owner dashboard combines token status, remaining service usage, and the
  recent action log on one route so token holders have a single self-serve hub.
*/
import { computed, inject, onMounted, ref, watch } from "vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessDashboard } from "../services/accessPlanService";

const portalContext = inject("portalContext");
const portalAccess = inject("portalAccess");
const { locale } = usePortalI18n();
const tr = (en, el) => (locale.value === "el" ? el : en);

const loading = ref(false);
const error = ref("");
const dashboard = ref(null);
const selectedService = ref("");
const selectedStatus = ref("");

const loadDashboard = async () => {
  if (portalAccess?.planType?.value !== "token" || !portalAccess?.activeToken?.value) {
    dashboard.value = null;
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    dashboard.value = await fetchAccessDashboard(
      portalContext.apiBaseUrl.value,
      portalAccess.activeToken.value,
      {
        serviceKey: selectedService.value,
        status: selectedStatus.value,
      }
    );
  } catch (caughtError) {
    error.value =
      caughtError instanceof Error
        ? caughtError.message
        : tr("Could not load the dashboard.", "Δεν ήταν δυνατή η φόρτωση του dashboard.");
  } finally {
    loading.value = false;
  }
};

const formatQuota = (serviceItem) => {
  const requests = serviceItem?.quota?.requests;
  const words = serviceItem?.quota?.words;
  const parts = [];

  if (requests?.limit !== null) {
    parts.push(`${requests.remaining}/${requests.limit} requests`);
  }

  if (words?.limit !== null) {
    parts.push(`${words.remaining}/${words.limit} words`);
  }

  if (parts.length === 0) {
    return tr("Unlimited", "Απεριόριστο");
  }

  return parts.join(" · ");
};

const services = computed(() => dashboard.value?.services || []);
const historyItems = computed(() => dashboard.value?.history?.items || []);

watch(
  () => [
    portalAccess?.planType?.value,
    portalAccess?.activeToken?.value,
    selectedService.value,
    selectedStatus.value,
  ],
  () => {
    void loadDashboard();
  }
);

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <section class="flow-view">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ tr("Owner dashboard", "Dashboard κατόχου") }}</h2>
      <p class="section-head__subtitle">
        {{
          tr(
            "See your token limits, remaining usage, and recent service actions.",
            "Δείτε τα όρια του token, το υπόλοιπο χρήσης και τις πρόσφατες ενέργειες υπηρεσιών."
          )
        }}
      </p>
    </div>

    <div v-if="portalAccess?.planType?.value !== 'token'" class="tool-card">
      <p class="tool-card__description">
        {{
          tr(
            "Apply a paid token from any service screen to unlock the owner dashboard.",
            "Εφαρμόστε paid token από οποιαδήποτε οθόνη υπηρεσίας για να ξεκλειδώσετε το owner dashboard."
          )
        }}
      </p>
    </div>

    <div v-else class="dashboard-grid">
      <div class="tool-card">
        <p class="merge-step__title">{{ tr("Token overview", "Επισκόπηση token") }}</p>
        <p class="tool-card__description">
          <strong>{{ dashboard?.token?.alias || portalAccess?.plan?.token?.alias }}</strong>
        </p>
        <p class="tool-card__description">
          {{ tr("Expires", "Λήξη") }}:
          <strong>{{ dashboard?.token?.expiresAt || portalAccess?.plan?.token?.expiresAt }}</strong>
        </p>
        <p class="tool-card__description">
          {{ tr("Enabled services", "Ενεργές υπηρεσίες") }}:
          {{
            (dashboard?.token?.serviceFlags || portalAccess?.plan?.token?.serviceFlags || []).join(
              ", "
            )
          }}
        </p>
      </div>

      <div class="tool-card">
        <p class="merge-step__title">{{ tr("Usage by service", "Χρήση ανά υπηρεσία") }}</p>
        <div class="dashboard-service-list">
          <article
            v-for="service in services"
            :key="service.serviceKey"
            class="dashboard-service-item"
          >
            <strong>{{ service.serviceKey }}</strong>
            <span>{{ formatQuota(service) }}</span>
          </article>
        </div>
      </div>

      <div class="tool-card dashboard-history">
        <div class="dashboard-history__head">
          <p class="merge-step__title">{{ tr("Recent activity", "Πρόσφατη δραστηριότητα") }}</p>
          <div class="dashboard-history__filters">
            <select v-model="selectedService" class="rotation-select">
              <option value="">{{ tr("All services", "Όλες οι υπηρεσίες") }}</option>
              <option
                v-for="service in services"
                :key="service.serviceKey"
                :value="service.serviceKey"
              >
                {{ service.serviceKey }}
              </option>
            </select>
            <select v-model="selectedStatus" class="rotation-select">
              <option value="">{{ tr("All statuses", "Όλες οι καταστάσεις") }}</option>
              <option value="success">{{ tr("Success", "Επιτυχία") }}</option>
              <option value="failed">{{ tr("Failed", "Αποτυχία") }}</option>
            </select>
          </div>
        </div>

        <p v-if="loading" class="tool-card__description">
          {{ tr("Loading dashboard...", "Φόρτωση dashboard...") }}
        </p>
        <p v-else-if="error" class="tool-card__description tool-card__description--error">
          {{ error }}
        </p>
        <div v-else class="dashboard-history__list">
          <article v-for="item in historyItems" :key="item.eventId" class="dashboard-history__item">
            <div>
              <strong>{{ item.operationName }}</strong>
              <p class="tool-card__description">{{ item.serviceKey }} · {{ item.status }}</p>
            </div>
            <div class="dashboard-history__meta">
              <span>{{ item.createdAt }}</span>
              <span v-if="item.consumedWords">{{ item.consumedWords }} words</span>
              <span v-if="item.consumedRequests">{{ item.consumedRequests }} request</span>
            </div>
          </article>
          <p v-if="!historyItems.length" class="tool-card__description">
            {{ tr("No activity yet.", "Δεν υπάρχει δραστηριότητα ακόμα.") }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
  The dashboard layout favors compact cards first so token owners can scan
  quota status quickly before dropping into the larger history section.
*/
.dashboard-grid {
  display: grid;
  gap: 1rem;
}

.dashboard-service-list,
.dashboard-history__list {
  display: grid;
  gap: 0.75rem;
}

.dashboard-service-item,
.dashboard-history__item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
}

.dashboard-history__head,
.dashboard-history__filters,
.dashboard-history__meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dashboard-history__head {
  justify-content: space-between;
  align-items: center;
}

.dashboard-history__meta {
  color: var(--ink-soft);
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .dashboard-service-item,
  .dashboard-history__item,
  .dashboard-history__head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
