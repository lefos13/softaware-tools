<script setup lang="ts">
/*
  The shared flow shell now owns the step progression so access choice, form
  work, and results appear as distinct phases across every service screen.
*/
import { computed, inject, provide, ref, watch } from "vue";
import { usePortalI18n } from "../../i18n";
import type { PortalAccessStore, PortalI18n, PortalRouter, ServiceKey } from "../../types/shared";
import { portalAccessKey, portalRouterKey } from "../../types/shared";
import type { CurrentAccessService, ServiceFlowShellContext } from "../../types/services";

const props = withDefaults(
  defineProps<{
    serviceKey: ServiceKey;
    hasResult?: boolean;
    loading?: boolean;
    apiHealthy?: boolean;
  }>(),
  {
    hasResult: false,
    loading: false,
    apiHealthy: true,
  }
);

const portalAccess = inject(portalAccessKey) as PortalAccessStore | undefined;
const portalRouter = inject(portalRouterKey) as PortalRouter | undefined;
const { t } = usePortalI18n() as PortalI18n;
const tokenInput = ref("");
const submitError = ref("");
const hasChosenAccess = ref(false);
const shellLoading = ref(false);
const shellHasResult = ref(false);

if (!portalAccess) {
  throw new Error("Portal access store is not available.");
}

provide<ServiceFlowShellContext>("serviceFlowShell", {
  setLoading(value) {
    shellLoading.value = value === true;
  },
  setHasResult(value) {
    shellHasResult.value = value === true;
  },
});

const currentService = computed<CurrentAccessService | null>(
  () =>
    portalAccess.plan.value?.services?.find((service) => service.serviceKey === props.serviceKey) ||
    null
);

const currentStep = computed(() => {
  if (!hasChosenAccess.value) {
    return 1;
  }

  if (shellLoading.value || props.loading || shellHasResult.value || props.hasResult) {
    return 3;
  }

  return 2;
});

const stepItems = computed(() => [
  {
    id: 1,
    title: t("flowShell.steps.chooseAccess.title"),
    description: t("flowShell.steps.chooseAccess.description"),
  },
  {
    id: 2,
    title: t("flowShell.steps.configureRequest.title"),
    description: t("flowShell.steps.configureRequest.description"),
  },
  {
    id: 3,
    title: t("flowShell.steps.reviewResult.title"),
    description: t("flowShell.steps.reviewResult.description"),
  },
]);

const quotaLabel = computed(() => {
  const service = currentService.value;
  if (!service?.enabled) {
    return t("flowShell.quota.serviceDisabled");
  }

  const requests = service?.quota?.requests;
  const words = service?.quota?.words;
  const parts = [];

  if (requests && requests.limit !== null) {
    parts.push(
      t("flowShell.quota.requestsLeft", {
        remaining: requests.remaining,
        limit: requests.limit,
      })
    );
  }

  if (words && words.limit !== null) {
    parts.push(
      t("flowShell.quota.wordsLeft", {
        remaining: words.remaining,
        limit: words.limit,
      })
    );
  }

  return parts.length ? parts.join(" · ") : t("flowShell.quota.unlimited");
});

const currentPlanLabel = computed(() =>
  portalAccess.planType.value === "token" ? t("flowShell.plan.token") : t("flowShell.plan.free")
);

watch(
  () => portalAccess.activeToken.value,
  (nextToken) => {
    if (String(nextToken || "").trim()) {
      hasChosenAccess.value = true;
    }
  },
  { immediate: true }
);

const submitToken = async () => {
  submitError.value = "";

  try {
    await portalAccess.validateToken(tokenInput.value);
    hasChosenAccess.value = true;
    tokenInput.value = "";
  } catch (caughtError) {
    submitError.value =
      caughtError instanceof Error ? caughtError.message : t("flowShell.errors.tokenValidation");
  }
};

const continueWithFreePlan = async () => {
  submitError.value = "";

  try {
    await portalAccess.startFreePlan();
    hasChosenAccess.value = true;
    tokenInput.value = "";
  } catch (caughtError) {
    submitError.value =
      caughtError instanceof Error ? caughtError.message : t("flowShell.errors.freePlanContinue");
  }
};

const clearChosenAccess = async () => {
  submitError.value = "";
  hasChosenAccess.value = false;
  shellHasResult.value = false;
  shellLoading.value = false;
  await portalAccess.logout();
};

const openDashboard = () => {
  portalRouter?.navigate("/dashboard");
};
</script>

<template>
  <section class="service-flow-shell">
    <ol class="service-flow-shell__steps" :aria-label="t('flowShell.stepsAria', { serviceKey })">
      <li
        v-for="step in stepItems"
        :key="step.id"
        class="service-flow-shell__step"
        :class="{
          'service-flow-shell__step--active': currentStep === step.id,
          'service-flow-shell__step--complete': currentStep > step.id,
        }"
      >
        <span class="service-flow-shell__index">{{ step.id }}</span>
        <span class="service-flow-shell__copy">
          <strong>{{ step.title }}</strong>
          <span>{{ step.description }}</span>
        </span>
      </li>
    </ol>

    <div v-if="!hasChosenAccess" class="tool-card service-flow-shell__entry">
      <div class="service-flow-shell__entry-copy">
        <p class="merge-step__title">{{ t("flowShell.entry.stepTitle") }}</p>
        <p class="tool-card__description">
          {{ t("flowShell.entry.description") }}
        </p>
      </div>

      <div class="service-flow-shell__entry-actions">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          :disabled="portalAccess?.loading?.value || !apiHealthy"
          :placeholder="t('flowShell.entry.tokenPlaceholder')"
          autocomplete="off"
        />
        <div class="service-flow-shell__buttons">
          <button
            type="button"
            class="button button--primary"
            :disabled="portalAccess?.loading?.value || !apiHealthy"
            @click="submitToken"
          >
            {{
              portalAccess?.loading?.value
                ? t("flowShell.entry.checking")
                : t("flowShell.entry.applyToken")
            }}
          </button>
          <button
            type="button"
            class="button button--secondary"
            :disabled="portalAccess?.loading?.value"
            @click="continueWithFreePlan"
          >
            {{ t("flowShell.entry.continueFree") }}
          </button>
        </div>
      </div>

      <p
        v-if="submitError || portalAccess?.error?.value"
        class="tool-card__description tool-card__description--error"
      >
        {{ submitError || portalAccess?.error?.value }}
      </p>
    </div>

    <div v-else class="tool-card service-flow-shell__status">
      <div class="service-flow-shell__entry-copy">
        <p class="merge-step__title">
          {{ t("flowShell.activePlan.stepTitle", { step: currentStep }) }}
        </p>
        <p class="tool-card__description">{{ currentPlanLabel }}</p>
        <p v-if="currentService" class="tool-card__description">{{ quotaLabel }}</p>
      </div>
      <div class="service-flow-shell__buttons">
        <button
          v-if="portalAccess?.planType?.value === 'token'"
          type="button"
          class="button button--secondary"
          @click="openDashboard"
        >
          {{ t("flowShell.activePlan.openDashboard") }}
        </button>
        <button type="button" class="button button--secondary" @click="clearChosenAccess">
          {{ t("flowShell.activePlan.changeAccess") }}
        </button>
      </div>
    </div>

    <slot v-if="hasChosenAccess" :plan="portalAccess?.plan?.value" :service="currentService" />
  </section>
</template>

<style src="./ServiceFlowShell.scss" lang="scss"></style>
