<script setup lang="ts">
/*
  The plans screen pulls its catalog from the API so public pricing/limits and
  token-request options stay aligned with the same presets admins approve.
*/
import { computed, inject, onMounted, ref } from "vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessPlanCatalog, submitTokenRequest } from "../services/accessPlanService";
import type { AccessPlanCatalogPolicy, AccessPlanCatalogResult } from "../types/services";
import type { PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";

const portalContext = inject(portalContextKey) as PortalContext | undefined;
const { t } = usePortalI18n() as PortalI18n;

if (!portalContext) {
  throw new Error("Portal context is not available.");
}

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const catalog = ref<AccessPlanCatalogResult | null>(null);
const form = ref({
  alias: "",
  email: "",
  servicePolicies: {} as Record<string, string>,
});

/*
  Request selectors are derived from the paid-plan catalog so the UI never
  offers presets that the backend would reject during submission.
*/
const paidPlans = computed(() => catalog.value?.paidPlans || []);
const freeServices = computed(() => catalog.value?.freePlan?.services || []);

const buildEmptyPolicies = (): Record<string, string> =>
  Object.fromEntries(paidPlans.value.map((service) => [String(service.serviceKey), ""]));

const resetForm = (): void => {
  form.value = {
    alias: "",
    email: "",
    servicePolicies: buildEmptyPolicies(),
  };
};

const loadCatalog = async (): Promise<void> => {
  loading.value = true;
  error.value = "";

  try {
    catalog.value = await fetchAccessPlanCatalog(portalContext.apiBaseUrl.value);
    form.value.servicePolicies = buildEmptyPolicies();
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : t("plans.errors.load");
  } finally {
    loading.value = false;
  }
};

const formatPolicy = (policy: AccessPlanCatalogPolicy): string[] => {
  const lines = [];

  if (policy.kind === "unlimited") {
    lines.push(t("plans.policyKinds.unlimited"));
  }

  if (Number.isInteger(policy.requestsPerDay)) {
    lines.push(t("plans.policyKinds.requestsPerDay", { value: policy.requestsPerDay }));
  }

  if (Number.isInteger(policy.wordsTotal)) {
    lines.push(t("plans.policyKinds.wordsTotal", { value: policy.wordsTotal }));
  }

  return lines;
};

const submitRequest = async (): Promise<void> => {
  submitting.value = true;
  error.value = "";
  success.value = "";

  try {
    const servicePolicies = Object.fromEntries(
      Object.entries(form.value.servicePolicies).filter(([, preset]) => String(preset || "").trim())
    );
    await submitTokenRequest(portalContext.apiBaseUrl.value, {
      alias: form.value.alias,
      email: form.value.email,
      servicePolicies,
    });
    success.value = t("plans.submitted");
    resetForm();
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : t("plans.errors.submit");
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  void loadCatalog();
});
</script>

<template>
  <section class="flow-view plans-view">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">{{ t("pages.plans.title") }}</h2>
      <p class="section-head__subtitle">{{ t("pages.plans.subtitle") }}</p>
    </div>

    <p v-if="error" class="tool-card__description tool-card__description--error">{{ error }}</p>
    <p v-if="success" class="tool-card__description">{{ success }}</p>

    <div class="plans-layout">
      <article class="tool-card plans-panel plans-panel--free">
        <div class="plans-panel__head">
          <div>
            <p class="plans-panel__eyebrow">Free</p>
            <h3 class="tool-card__title">{{ t("plans.freeTitle") }}</h3>
            <p class="tool-card__description">{{ t("plans.freeSubtitle") }}</p>
          </div>
        </div>

        <p v-if="loading" class="tool-card__description">{{ t("accessDashboard.loading") }}</p>
        <div v-else class="plans-service-grid">
          <article
            v-for="service in freeServices"
            :key="`free-${service.serviceKey}`"
            class="plans-service-card"
          >
            <strong class="plans-service-card__title">{{ service.serviceKey }}</strong>
            <p
              v-for="line in formatPolicy({
                preset: String(service.preset || ''),
                kind: String(service.kind || 'unlimited'),
                requestsPerDay: service.requestsPerDay,
                wordsTotal: service.wordsTotal,
              })"
              :key="`${service.serviceKey}-${line}`"
              class="tool-card__description"
            >
              {{ line }}
            </p>
          </article>
        </div>
      </article>

      <article class="tool-card plans-panel">
        <div class="plans-panel__head">
          <div>
            <p class="plans-panel__eyebrow">Paid</p>
            <h3 class="tool-card__title">{{ t("plans.paidTitle") }}</h3>
            <p class="tool-card__description">{{ t("plans.paidSubtitle") }}</p>
          </div>
        </div>

        <p v-if="catalog?.requestDefaults?.ttl" class="tool-card__description plans-panel__ttl">
          {{ t("plans.defaultTtl", { ttl: catalog.requestDefaults.ttl }) }}
        </p>

        <div class="plans-paid-groups">
          <section
            v-for="service in paidPlans"
            :key="`paid-${service.serviceKey}`"
            class="plans-paid-group"
          >
            <h4 class="plans-paid-group__title">{{ service.serviceKey }}</h4>
            <div class="plans-service-grid">
              <article
                v-for="policy in service.presets || []"
                :key="`${service.serviceKey}-${policy.preset}`"
                class="plans-service-card plans-service-card--paid"
              >
                <strong class="plans-service-card__title">{{ policy.preset }}</strong>
                <p
                  v-for="line in formatPolicy(policy)"
                  :key="`${service.serviceKey}-${policy.preset}-${line}`"
                  class="tool-card__description"
                >
                  {{ line }}
                </p>
              </article>
            </div>
          </section>
        </div>
      </article>
    </div>

    <article class="tool-card plans-request">
      <div class="plans-panel__head">
        <div>
          <h3 class="tool-card__title">{{ t("plans.requestTitle") }}</h3>
          <p class="tool-card__description">{{ t("plans.requestSubtitle") }}</p>
        </div>
      </div>

      <div class="plans-request__grid">
        <label class="plans-request__field">
          <span>{{ t("plans.alias") }}</span>
          <input
            v-model="form.alias"
            type="text"
            :placeholder="t('plans.aliasPlaceholder')"
            :disabled="submitting"
          />
        </label>
        <label class="plans-request__field">
          <span>{{ t("plans.email") }}</span>
          <input
            v-model="form.email"
            type="email"
            :placeholder="t('plans.emailPlaceholder')"
            :disabled="submitting"
          />
        </label>
      </div>

      <div class="plans-request__services">
        <label
          v-for="service in paidPlans"
          :key="`request-${service.serviceKey}`"
          class="plans-request__field"
        >
          <span>{{ service.serviceKey }}</span>
          <select v-model="form.servicePolicies[String(service.serviceKey)]" :disabled="submitting">
            <option value="">{{ t("plans.disabled") }}</option>
            <option
              v-for="policy in service.presets || []"
              :key="`${service.serviceKey}-${policy.preset}`"
              :value="policy.preset"
            >
              {{ policy.preset }}
            </option>
          </select>
        </label>
      </div>

      <div class="preview-card__actions">
        <button
          type="button"
          class="button button--primary"
          :disabled="submitting || loading"
          @click="submitRequest"
        >
          {{ submitting ? t("plans.submitting") : t("plans.submit") }}
        </button>
      </div>
    </article>
  </section>
</template>

<style src="./PlansView.scss" lang="scss"></style>
