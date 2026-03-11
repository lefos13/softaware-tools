<script setup lang="ts">
/*
  The plans page now frames the same catalog and request flow as a guided
  client-facing landing page, while local helpers translate raw service keys
  and presets into readable labels without changing the backend contract.
*/
import { computed, inject, onMounted, ref } from "vue";
import { usePortalI18n } from "../i18n";
import { fetchAccessPlanCatalog, submitTokenRequest } from "../services/accessPlanService";
import type { AccessPlanCatalogPolicy, AccessPlanCatalogResult } from "../types/services";
import type { PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";

interface PolicyDisplayItem {
  id: string;
  label: string;
  summary: string;
  details: string[];
  policy: AccessPlanCatalogPolicy;
}

interface ServiceDisplayItem {
  key: string;
  label: string;
  summary: string;
  freeSummary?: string;
  paidSummary?: string;
  presets: PolicyDisplayItem[];
}

const portalContext = inject(portalContextKey) as PortalContext | undefined;
const i18n = usePortalI18n() as PortalI18n;
const { t } = i18n;

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

const paidPlans = computed(() => catalog.value?.paidPlans || []);
const freeServices = computed(() => catalog.value?.freePlan?.services || []);

const createHumanizedLabel = (value: string): string =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildEmptyPolicies = (): Record<string, string> =>
  Object.fromEntries(paidPlans.value.map((service) => [String(service.serviceKey), ""]));

const resetForm = (): void => {
  form.value = {
    alias: "",
    email: "",
    servicePolicies: buildEmptyPolicies(),
  };
};

const formatPolicyLine = (key: "requestsPerDay" | "wordsTotal", value: number): string =>
  t(`plans.policyKinds.${key}`, {
    value: new Intl.NumberFormat(i18n.locale.value).format(value),
  });

const formatPolicy = (policy: AccessPlanCatalogPolicy): string[] => {
  const lines = [];

  if (policy.kind === "unlimited") {
    lines.push(t("plans.policyKinds.unlimited"));
  }

  if (Number.isInteger(policy.requestsPerDay)) {
    lines.push(formatPolicyLine("requestsPerDay", Number(policy.requestsPerDay)));
  }

  if (Number.isInteger(policy.wordsTotal)) {
    lines.push(formatPolicyLine("wordsTotal", Number(policy.wordsTotal)));
  }

  return lines.length ? lines : [t("plans.policyKinds.onRequest")];
};

const formatPolicySummary = (policy: AccessPlanCatalogPolicy): string =>
  formatPolicy(policy).join(" · ");

const getServiceLabel = (serviceKey: string): string =>
  t(`plans.serviceLabels.${serviceKey}`, {}, createHumanizedLabel(serviceKey));

const getPresetLabel = (serviceKey: string, preset: string): string =>
  t(
    `plans.presetLabels.${serviceKey}.${preset}`,
    {},
    t(`plans.presetLabels.common.${preset}`, {}, createHumanizedLabel(preset))
  );

const createPolicyDisplay = (
  serviceKey: string,
  policy: AccessPlanCatalogPolicy
): PolicyDisplayItem => ({
  id: `${serviceKey}-${policy.preset}`,
  label: getPresetLabel(serviceKey, String(policy.preset || "")),
  summary: formatPolicySummary(policy),
  details: formatPolicy(policy),
  policy,
});

const freeServiceCards = computed<ServiceDisplayItem[]>(() =>
  freeServices.value.map((service) => {
    const policy: AccessPlanCatalogPolicy = {
      preset: String(service.preset || "free"),
      kind: String(service.kind || "unlimited"),
      requestsPerDay: service.requestsPerDay,
      wordsTotal: service.wordsTotal,
    };

    return {
      key: String(service.serviceKey),
      label: getServiceLabel(String(service.serviceKey)),
      summary: formatPolicySummary(policy),
      presets: [],
    };
  })
);

const paidServiceCards = computed<ServiceDisplayItem[]>(() =>
  paidPlans.value.map((service) => {
    const presets = (service.presets || []).map((policy) =>
      createPolicyDisplay(String(service.serviceKey), policy)
    );

    return {
      key: String(service.serviceKey),
      label: getServiceLabel(String(service.serviceKey)),
      summary: presets.map((item) => item.summary).join(" / "),
      presets,
    };
  })
);

/*
  Comparison and form selectors stay derived from the catalog response so the
  marketing layout still exposes only valid service presets and current limits.
*/
const comparisonRows = computed<ServiceDisplayItem[]>(() => {
  const freeByKey = new Map(
    freeServices.value.map((service) => [String(service.serviceKey), service])
  );
  const paidByKey = new Map(
    paidPlans.value.map((service) => [String(service.serviceKey), service])
  );
  const serviceKeys = Array.from(new Set([...freeByKey.keys(), ...paidByKey.keys()]));

  return serviceKeys.map((serviceKey) => {
    const service = paidByKey.get(serviceKey);
    const freeService = freeByKey.get(serviceKey);
    const freePolicy: AccessPlanCatalogPolicy = {
      preset: String(freeService?.preset || "free"),
      kind: String(freeService?.kind || "unlimited"),
      requestsPerDay: freeService?.requestsPerDay,
      wordsTotal: freeService?.wordsTotal,
    };
    const firstPreset = service?.presets?.[0];
    const paidSummary = firstPreset
      ? formatPolicySummary(firstPreset)
      : t("plans.policyKinds.onRequest");

    return {
      key: serviceKey,
      label: getServiceLabel(serviceKey),
      summary: "",
      freeSummary: freeService
        ? formatPolicySummary(freePolicy)
        : t("plans.comparison.notIncluded"),
      paidSummary,
      presets: [],
    };
  });
});

const hasSelectedServices = computed(() =>
  Object.values(form.value.servicePolicies).some((preset) => String(preset || "").trim())
);

const requestSummary = computed(() => {
  const count = Object.values(form.value.servicePolicies).filter((preset) =>
    String(preset || "").trim()
  ).length;
  return t("plans.form.selectionCount", { count });
});

/*
  The pricing-style spotlight mirrors the provided reference while keeping the
  labels truthful to this portal by using Free and Paid instead of fake prices.
*/
const spotlightCards = computed(() => [
  {
    id: "free",
    tone: "free",
    title: t("plans.freeTitle"),
    subtitle: t("plans.spotlight.perLabel"),
    priceLabel: t("plans.spotlight.freeBadge"),
    features: [
      t("plans.spotlight.free.features.access"),
      t("plans.spotlight.free.features.limits"),
      t("plans.spotlight.free.features.start"),
      t("plans.spotlight.free.features.browser"),
      t("plans.spotlight.free.features.request"),
    ],
    cta: t("plans.spotlight.free.cta"),
  },
  {
    id: "paid",
    tone: "paid",
    title: t("plans.paidTitle"),
    subtitle: t("plans.spotlight.perLabel"),
    priceLabel: t("plans.spotlight.paidBadge"),
    features: [
      t("plans.spotlight.paid.features.presets"),
      t("plans.spotlight.paid.features.volume"),
      t("plans.spotlight.paid.features.email"),
      t("plans.spotlight.paid.features.multiService"),
      t("plans.spotlight.paid.features.review"),
    ],
    cta: t("plans.spotlight.paid.cta"),
  },
]);

const statusTone = computed<"error" | "success" | "loading" | "idle">(() => {
  if (error.value) {
    return "error";
  }

  if (success.value) {
    return "success";
  }

  if (loading.value) {
    return "loading";
  }

  return "idle";
});

const statusMessage = computed(() => {
  if (error.value) {
    return error.value;
  }

  if (success.value) {
    return success.value;
  }

  if (loading.value) {
    return t("accessDashboard.loading");
  }

  return "";
});

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
    <div class="plans-hero">
      <div class="plans-hero__intro">
        <div class="section-head">
          <h2 class="section-head__title">{{ t("plans.hero.title") }}</h2>
          <p class="section-head__subtitle">{{ t("plans.hero.subtitle") }}</p>
        </div>
        <p class="plans-hero__lead">{{ t("plans.hero.lead") }}</p>
        <div class="plans-hero__actions">
          <a class="button button--primary plans-hero__cta" href="#plans-request-form">
            {{ t("plans.hero.cta") }}
          </a>
        </div>
      </div>

      <div class="plans-spotlight plans-spotlight--hero">
        <article
          v-for="card in spotlightCards"
          :key="card.id"
          class="plans-spotlight-card"
          :class="`plans-spotlight-card--${card.tone}`"
        >
          <div class="plans-spotlight-card__cap">
            <h4 class="plans-spotlight-card__title">{{ card.title }}</h4>
            <p class="plans-spotlight-card__subtitle">{{ card.subtitle }}</p>
          </div>
          <div class="plans-spotlight-card__price">
            <span>{{ card.priceLabel }}</span>
          </div>
          <div class="plans-spotlight-card__body">
            <ul class="plans-spotlight-card__features">
              <li v-for="feature in card.features" :key="feature">
                {{ feature }}
              </li>
            </ul>
            <a class="plans-spotlight-card__cta" href="#plans-request-form">
              {{ card.cta }}
            </a>
          </div>
        </article>
      </div>
    </div>

    <section class="plans-section">
      <div class="section-head">
        <h3 class="section-head__title">{{ t("plans.comparison.title") }}</h3>
        <p class="section-head__subtitle">{{ t("plans.comparison.subtitle") }}</p>
      </div>

      <div class="plans-comparison-intro">
        <article class="tool-card plans-highlight plans-highlight--free">
          <p class="plans-highlight__eyebrow">{{ t("plans.freeTitle") }}</p>
          <h4 class="tool-card__title">{{ t("plans.comparison.freeHeading") }}</h4>
          <p class="tool-card__description">{{ t("plans.comparison.freeBody") }}</p>
        </article>
        <article class="tool-card plans-highlight plans-highlight--paid">
          <p class="plans-highlight__eyebrow">{{ t("plans.paidTitle") }}</p>
          <h4 class="tool-card__title">{{ t("plans.comparison.paidHeading") }}</h4>
          <p class="tool-card__description">{{ t("plans.comparison.paidBody") }}</p>
        </article>
      </div>

      <div class="tool-card plans-comparison-table">
        <div class="plans-comparison-table__head">
          <span>{{ t("plans.comparison.columns.service") }}</span>
          <span>{{ t("plans.comparison.columns.free") }}</span>
          <span>{{ t("plans.comparison.columns.paid") }}</span>
        </div>

        <div v-if="!loading" class="plans-comparison-table__body">
          <article
            v-for="row in comparisonRows"
            :key="`comparison-${row.key}`"
            class="plans-comparison-table__row"
          >
            <h4 class="plans-comparison-table__service">{{ row.label }}</h4>
            <p class="plans-comparison-table__value">{{ row.freeSummary }}</p>
            <p class="plans-comparison-table__value plans-comparison-table__value--paid">
              {{ row.paidSummary }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="plans-section">
      <div class="section-head">
        <h3 class="section-head__title">{{ t("plans.catalog.title") }}</h3>
        <p class="section-head__subtitle">{{ t("plans.catalog.subtitle") }}</p>
      </div>

      <div class="plans-catalog">
        <article class="tool-card plans-catalog__rail plans-catalog__rail--free">
          <div class="plans-catalog__head">
            <div>
              <p class="plans-catalog__eyebrow">{{ t("plans.freeTitle") }}</p>
              <h4 class="tool-card__title">{{ t("plans.catalog.freeTitle") }}</h4>
            </div>
            <p class="tool-card__description">{{ t("plans.catalog.freeSubtitle") }}</p>
          </div>

          <div class="plans-service-grid plans-service-grid--free">
            <article
              v-for="service in freeServiceCards"
              :key="`free-${service.key}`"
              class="plans-service-card"
            >
              <p class="plans-service-card__eyebrow">{{ t("plans.catalog.included") }}</p>
              <h5 class="plans-service-card__title">{{ service.label }}</h5>
              <p class="plans-service-card__summary">{{ service.summary }}</p>
            </article>
          </div>
        </article>

        <article class="tool-card plans-catalog__rail plans-catalog__rail--paid">
          <div class="plans-catalog__head">
            <div>
              <p class="plans-catalog__eyebrow">{{ t("plans.paidTitle") }}</p>
              <h4 class="tool-card__title">{{ t("plans.catalog.paidTitle") }}</h4>
            </div>
            <p class="tool-card__description">{{ t("plans.catalog.paidSubtitle") }}</p>
          </div>

          <div class="plans-paid-groups">
            <section
              v-for="service in paidServiceCards"
              :key="`paid-${service.key}`"
              class="plans-paid-group"
            >
              <div class="plans-paid-group__head">
                <h5 class="plans-paid-group__title">{{ service.label }}</h5>
                <p class="tool-card__description">{{ t("plans.catalog.chooseOnePreset") }}</p>
              </div>
              <div class="plans-service-grid">
                <article
                  v-for="policy in service.presets"
                  :key="policy.id"
                  class="plans-service-card plans-service-card--paid"
                >
                  <p class="plans-service-card__eyebrow">{{ t("plans.catalog.presetLabel") }}</p>
                  <h6 class="plans-service-card__title">{{ policy.label }}</h6>
                  <p class="plans-service-card__summary">{{ policy.summary }}</p>
                  <ul class="plans-detail-list">
                    <li v-for="detail in policy.details" :key="`${policy.id}-${detail}`">
                      {{ detail }}
                    </li>
                  </ul>
                </article>
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>

    <section id="plans-request-form" class="plans-section">
      <div class="section-head">
        <h3 class="section-head__title">{{ t("plans.form.title") }}</h3>
        <p class="section-head__subtitle">{{ t("plans.form.subtitle") }}</p>
      </div>

      <div class="plans-request-layout">
        <article class="tool-card plans-request-intro">
          <p class="plans-request-intro__eyebrow">{{ t("plans.form.sideLabel") }}</p>
          <h4 class="tool-card__title">{{ t("plans.form.sideTitle") }}</h4>
          <p class="tool-card__description">{{ t("plans.form.sideBody") }}</p>
          <ul class="plans-bullet-list">
            <li>{{ t("plans.form.points.identity") }}</li>
            <li>{{ t("plans.form.points.selection") }}</li>
            <li>{{ t("plans.form.points.review") }}</li>
          </ul>
        </article>

        <form class="tool-card plans-request" @submit.prevent="submitRequest">
          <div
            v-if="statusMessage"
            class="plans-status"
            :class="`plans-status--${statusTone}`"
            role="status"
            aria-live="polite"
          >
            <strong class="plans-status__label">
              {{ t(`plans.status.${statusTone}`) }}
            </strong>
            <p class="plans-status__message">{{ statusMessage }}</p>
          </div>

          <div class="plans-request__grid">
            <label class="plans-request__field">
              <span>{{ t("plans.alias") }}</span>
              <small>{{ t("plans.form.aliasHelp") }}</small>
              <input
                v-model="form.alias"
                type="text"
                :placeholder="t('plans.aliasPlaceholder')"
                :disabled="submitting"
              />
            </label>
            <label class="plans-request__field">
              <span>{{ t("plans.email") }}</span>
              <small>{{ t("plans.form.emailHelp") }}</small>
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
              v-for="service in paidServiceCards"
              :key="`request-${service.key}`"
              class="plans-request__field plans-request__field--service"
            >
              <span>{{ service.label }}</span>
              <small>{{ t("plans.form.serviceHelp") }}</small>
              <select
                v-model="form.servicePolicies[service.key]"
                :title="service.label"
                :disabled="submitting || loading"
              >
                <option value="">{{ t("plans.disabled") }}</option>
                <option
                  v-for="policy in service.presets"
                  :key="policy.id"
                  :value="policy.policy.preset"
                >
                  {{ policy.label }} · {{ policy.summary }}
                </option>
              </select>
            </label>
          </div>

          <div class="plans-request__footer">
            <p class="plans-request__selection">
              {{ hasSelectedServices ? requestSummary : t("plans.form.noneSelected") }}
            </p>
            <div class="preview-card__actions">
              <button
                type="submit"
                class="button button--primary"
                :disabled="submitting || loading"
              >
                {{ submitting ? t("plans.submitting") : t("plans.submit") }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>

    <section class="plans-section plans-trust">
      <div class="section-head">
        <h3 class="section-head__title">{{ t("plans.trust.title") }}</h3>
        <p class="section-head__subtitle">{{ t("plans.trust.subtitle") }}</p>
      </div>

      <div class="plans-trust__grid">
        <article class="tool-card plans-trust__item">
          <h4 class="plans-trust__title">{{ t("plans.trust.items.privacy.title") }}</h4>
          <p class="tool-card__description">{{ t("plans.trust.items.privacy.body") }}</p>
        </article>
        <article class="tool-card plans-trust__item">
          <h4 class="plans-trust__title">{{ t("plans.trust.items.review.title") }}</h4>
          <p class="tool-card__description">{{ t("plans.trust.items.review.body") }}</p>
        </article>
        <article class="tool-card plans-trust__item">
          <h4 class="plans-trust__title">{{ t("plans.trust.items.access.title") }}</h4>
          <p class="tool-card__description">{{ t("plans.trust.items.access.body") }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style src="./PlansView.scss" lang="scss"></style>
