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
import type { AccessPricingSummary, PortalContext, PortalI18n } from "../types/shared";
import { portalContextKey } from "../types/shared";

interface PolicyDisplayItem {
  id: string;
  label: string;
  summary: string;
  details: string[];
  priceLabel: string;
  pricing: AccessPricingSummary | null;
  policy: AccessPlanCatalogPolicy;
}

interface ServiceDisplayItem {
  key: string;
  label: string;
  summary: string;
  presets: PolicyDisplayItem[];
}

interface PlanRequestValidationErrors {
  alias: string;
  email: string;
  services: string;
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
const validationErrors = ref<PlanRequestValidationErrors>({
  alias: "",
  email: "",
  services: "",
});
const MAX_ALIAS_LENGTH = 120;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const premiumPlans = computed(() => catalog.value?.premiumPlans || []);
const freeServices = computed(() => catalog.value?.freePlan?.services || []);
const pricingDefaults = computed(() => catalog.value?.requestDefaults?.pricing || null);

const createHumanizedLabel = (value: string): string =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildEmptyPolicies = (): Record<string, string> =>
  Object.fromEntries(premiumPlans.value.map((service) => [String(service.serviceKey), ""]));

const resetForm = (): void => {
  form.value = {
    alias: "",
    email: "",
    servicePolicies: buildEmptyPolicies(),
  };
};

const resetValidationErrors = (): void => {
  validationErrors.value = {
    alias: "",
    email: "",
    services: "",
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

const formatMoney = (amount: number, currency?: string): string =>
  new Intl.NumberFormat(i18n.locale.value, {
    style: "currency",
    currency: String(currency || pricingDefaults.value?.currency || "EUR"),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

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
  priceLabel: formatMoney(Number(policy.pricing?.totalAmount || 0), policy.pricing?.currency),
  pricing: policy.pricing || null,
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

const premiumServiceCards = computed<ServiceDisplayItem[]>(() =>
  premiumPlans.value.map((service) => {
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

const hasSelectedServices = computed(() =>
  Object.values(form.value.servicePolicies).some((preset) => String(preset || "").trim())
);

const selectedPricing = computed<AccessPricingSummary>(() => {
  const items = premiumServiceCards.value.flatMap((service) => {
    const selectedPreset = String(form.value.servicePolicies[service.key] || "").trim();
    if (!selectedPreset) {
      return [];
    }

    const selectedPolicy = service.presets.find(
      (policy) => String(policy.policy.preset || "") === selectedPreset
    );

    if (!selectedPolicy?.pricing?.items?.length) {
      return [];
    }

    return selectedPolicy.pricing.items;
  });

  return {
    totalAmount: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    currency: String(items[0]?.currency || pricingDefaults.value?.currency || "EUR"),
    billingMode: String(items[0]?.billingMode || pricingDefaults.value?.billingMode || "one_time"),
    items,
  };
});

const requestSummary = computed(() => {
  const count = Object.values(form.value.servicePolicies).filter((preset) =>
    String(preset || "").trim()
  ).length;
  return t("plans.form.selectionCount", { count });
});

/*
  The pricing-style spotlight mirrors the provided reference while keeping the
  labels truthful to this portal by using Free and Premium with backend-backed quote tags.
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
    id: "premium",
    tone: "premium",
    title: t("plans.premiumTitle"),
    subtitle: t("plans.spotlight.perLabel"),
    priceLabel:
      selectedPricing.value.totalAmount > 0
        ? t("plans.spotlight.premiumBadgeWithAmount", {
            amount: formatMoney(selectedPricing.value.totalAmount, selectedPricing.value.currency),
          })
        : t("plans.spotlight.premiumBadge"),
    features: [
      t("plans.spotlight.premium.features.presets"),
      t("plans.spotlight.premium.features.volume"),
      t("plans.spotlight.premium.features.email"),
      t("plans.spotlight.premium.features.multiService"),
      t("plans.spotlight.premium.features.review"),
    ],
    cta: t("plans.spotlight.premium.cta"),
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

/*
  Validation normalizes request payload input before submit, blocks empty or
  malformed identity fields, and ensures selected presets are valid for the
  current catalog so client-side errors are shown before network requests.
*/
const getSelectedServicePolicies = (): Record<string, string> =>
  Object.fromEntries(
    Object.entries(form.value.servicePolicies).filter(([, preset]) => String(preset || "").trim())
  );

const isValidSelectedPreset = (serviceKey: string, preset: string): boolean => {
  const service = premiumPlans.value.find((item) => String(item.serviceKey) === String(serviceKey));
  if (!service) {
    return false;
  }

  return (service.presets || []).some(
    (policy) => String(policy.preset || "") === String(preset || "")
  );
};

const validateAlias = (): string => {
  const alias = String(form.value.alias || "").trim();

  if (!alias) {
    return t("plans.validation.aliasRequired");
  }

  if (alias.length < 2) {
    return t("plans.validation.aliasMin", { min: 2 });
  }

  if (alias.length > MAX_ALIAS_LENGTH) {
    return t("plans.validation.aliasMax", { max: MAX_ALIAS_LENGTH });
  }

  return "";
};

const validateEmail = (): string => {
  const email = String(form.value.email || "").trim();

  if (!email) {
    return t("plans.validation.emailRequired");
  }

  if (!emailPattern.test(email)) {
    return t("plans.validation.emailInvalid");
  }

  return "";
};

const validateServices = (): string => {
  const selectedPolicies = getSelectedServicePolicies();
  const selections = Object.entries(selectedPolicies);

  if (!selections.length) {
    return t("plans.validation.servicesRequired");
  }

  const hasInvalidSelection = selections.some(
    ([serviceKey, preset]) => !isValidSelectedPreset(serviceKey, String(preset))
  );
  if (hasInvalidSelection) {
    return t("plans.validation.servicesInvalid");
  }

  return "";
};

const validateForm = (): boolean => {
  const nextErrors: PlanRequestValidationErrors = {
    alias: validateAlias(),
    email: validateEmail(),
    services: validateServices(),
  };
  validationErrors.value = nextErrors;

  return !Object.values(nextErrors).some((value) => String(value || "").trim());
};

const onAliasBlur = (): void => {
  validationErrors.value.alias = validateAlias();
};

const onEmailBlur = (): void => {
  validationErrors.value.email = validateEmail();
};

const onServiceChange = (): void => {
  validationErrors.value.services = validateServices();
};

const loadCatalog = async (): Promise<void> => {
  loading.value = true;
  error.value = "";

  try {
    catalog.value = await fetchAccessPlanCatalog(portalContext.apiBaseUrl.value);
    form.value.servicePolicies = buildEmptyPolicies();
    resetValidationErrors();
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : t("plans.errors.load");
  } finally {
    loading.value = false;
  }
};

const submitRequest = async (): Promise<void> => {
  error.value = "";
  success.value = "";

  if (!validateForm()) {
    return;
  }

  const servicePolicies = getSelectedServicePolicies();
  const alias = String(form.value.alias || "").trim();
  const email = String(form.value.email || "").trim();

  submitting.value = true;

  try {
    const result = await submitTokenRequest(portalContext.apiBaseUrl.value, {
      alias,
      email,
      servicePolicies,
    });

    const quotedAmount = Number(result?.request?.pricing?.totalAmount || 0);
    const quotedCurrency = String(
      result?.request?.pricing?.currency || selectedPricing.value.currency
    );
    success.value = t("plans.submitted", {
      amount: formatMoney(quotedAmount, quotedCurrency),
    });
    resetForm();
    resetValidationErrors();
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

        <article class="tool-card plans-catalog__rail plans-catalog__rail--premium">
          <div class="plans-catalog__head">
            <div>
              <p class="plans-catalog__eyebrow">{{ t("plans.premiumTitle") }}</p>
              <h4 class="tool-card__title">{{ t("plans.catalog.premiumTitle") }}</h4>
            </div>
            <p class="tool-card__description">{{ t("plans.catalog.premiumSubtitle") }}</p>
          </div>

          <div class="plans-paid-groups">
            <section
              v-for="service in premiumServiceCards"
              :key="`premium-${service.key}`"
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
                  class="plans-service-card plans-service-card--premium"
                >
                  <p class="plans-service-card__eyebrow">{{ t("plans.catalog.presetLabel") }}</p>
                  <div class="plans-service-card__price-row">
                    <strong class="plans-service-card__price">{{ policy.priceLabel }}</strong>
                    <span class="plans-service-card__price-note">
                      {{ t("plans.form.priceTag") }}
                    </span>
                  </div>
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

      <div class="plans-request-layout-form">
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
            <label
              class="plans-request__field"
              :class="{ 'plans-request__field--invalid': validationErrors.alias }"
            >
              <span>{{ t("plans.alias") }}</span>
              <small id="plans-alias-help">{{ t("plans.form.aliasHelp") }}</small>
              <input
                v-model="form.alias"
                type="text"
                :placeholder="t('plans.aliasPlaceholder')"
                :disabled="submitting"
                required
                minlength="2"
                :maxlength="MAX_ALIAS_LENGTH"
                :aria-invalid="Boolean(validationErrors.alias)"
                aria-describedby="plans-alias-help plans-alias-error"
                @blur="onAliasBlur"
                @input="validationErrors.alias = ''"
              />
              <p
                v-if="validationErrors.alias"
                id="plans-alias-error"
                class="plans-field-error"
                role="alert"
              >
                {{ validationErrors.alias }}
              </p>
            </label>
            <label
              class="plans-request__field"
              :class="{ 'plans-request__field--invalid': validationErrors.email }"
            >
              <span>{{ t("plans.email") }}</span>
              <small id="plans-email-help">{{ t("plans.form.emailHelp") }}</small>
              <input
                v-model="form.email"
                type="email"
                :placeholder="t('plans.emailPlaceholder')"
                :disabled="submitting"
                required
                autocomplete="email"
                :aria-invalid="Boolean(validationErrors.email)"
                aria-describedby="plans-email-help plans-email-error"
                @blur="onEmailBlur"
                @input="validationErrors.email = ''"
              />
              <p
                v-if="validationErrors.email"
                id="plans-email-error"
                class="plans-field-error"
                role="alert"
              >
                {{ validationErrors.email }}
              </p>
            </label>
          </div>

          <div class="plans-request__services">
            <label
              v-for="service in premiumServiceCards"
              :key="`request-${service.key}`"
              class="plans-request__field plans-request__field--service"
            >
              <span>{{ service.label }}</span>
              <small>{{ t("plans.form.serviceHelp") }}</small>
              <select
                v-model="form.servicePolicies[service.key]"
                :title="service.label"
                :disabled="submitting || loading"
                @change="onServiceChange"
              >
                <option value="">{{ t("plans.disabled") }}</option>
                <option
                  v-for="policy in service.presets"
                  :key="policy.id"
                  :value="policy.policy.preset"
                >
                  {{ policy.label }} · {{ policy.summary }} · {{ policy.priceLabel }}
                </option>
              </select>
            </label>
          </div>
          <p v-if="validationErrors.services" class="plans-field-error" role="alert">
            {{ validationErrors.services }}
          </p>

          <div class="plans-request__footer">
            <p class="plans-request__selection">
              {{ hasSelectedServices ? requestSummary : t("plans.form.noneSelected") }}
            </p>
            <div class="plans-request__total">
              <span class="plans-request__total-label">{{ t("plans.form.totalLabel") }}</span>
              <strong class="plans-request__total-value">
                {{ formatMoney(selectedPricing.totalAmount, selectedPricing.currency) }}
              </strong>
            </div>
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
