<script setup>
/*
  The shared flow shell now owns the step progression so access choice, form
  work, and results appear as distinct phases across every service screen.
*/
import { computed, inject, provide, ref, watch } from "vue";

const props = defineProps({
  serviceKey: {
    type: String,
    required: true,
  },
  hasResult: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  apiHealthy: {
    type: Boolean,
    default: true,
  },
});

const portalAccess = inject("portalAccess");
const portalRouter = inject("portalRouter");
const tokenInput = ref("");
const submitError = ref("");
const hasChosenAccess = ref(false);
const shellLoading = ref(false);
const shellHasResult = ref(false);

provide("serviceFlowShell", {
  setLoading(value) {
    shellLoading.value = value === true;
  },
  setHasResult(value) {
    shellHasResult.value = value === true;
  },
});

const currentService = computed(
  () =>
    portalAccess?.plan?.value?.services?.find(
      (service) => service.serviceKey === props.serviceKey
    ) || null
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
    title: "Choose access",
    description: "Use a token or continue with the free plan",
  },
  {
    id: 2,
    title: "Configure request",
    description: "Fill in the service form",
  },
  {
    id: 3,
    title: "Review result",
    description: "Download output and inspect usage",
  },
]);

const quotaLabel = computed(() => {
  const service = currentService.value;
  if (!service?.enabled) {
    return "Service disabled for current token";
  }

  const requests = service?.quota?.requests;
  const words = service?.quota?.words;
  const parts = [];

  if (requests?.limit !== null) {
    parts.push(`${requests.remaining}/${requests.limit} requests left`);
  }

  if (words?.limit !== null) {
    parts.push(`${words.remaining}/${words.limit} words left`);
  }

  return parts.length ? parts.join(" · ") : "Unlimited";
});

const currentPlanLabel = computed(() =>
  portalAccess?.planType?.value === "token"
    ? "Paid token active for this browser session."
    : "Free plan selected for this service."
);

watch(
  () => portalAccess?.activeToken?.value,
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
      caughtError instanceof Error ? caughtError.message : "Token validation failed.";
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
      caughtError instanceof Error ? caughtError.message : "Could not continue with free plan.";
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
  portalRouter?.navigate?.("/dashboard");
};
</script>

<template>
  <section class="service-flow-shell">
    <ol class="service-flow-shell__steps" :aria-label="`${serviceKey} flow steps`">
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
        <p class="merge-step__title">Step 1 · Token or free usage</p>
        <p class="tool-card__description">
          Choose a paid token to unlock the owner dashboard and token limits, or continue with the
          free plan for this service.
        </p>
      </div>

      <div class="service-flow-shell__entry-actions">
        <input
          v-model="tokenInput"
          type="password"
          class="field"
          :disabled="portalAccess?.loading?.value || !apiHealthy"
          placeholder="Enter access token"
          autocomplete="off"
        />
        <div class="service-flow-shell__buttons">
          <button
            type="button"
            class="button button--primary"
            :disabled="portalAccess?.loading?.value || !apiHealthy"
            @click="submitToken"
          >
            {{ portalAccess?.loading?.value ? "Checking..." : "Apply token" }}
          </button>
          <button
            type="button"
            class="button button--secondary"
            :disabled="portalAccess?.loading?.value"
            @click="continueWithFreePlan"
          >
            Continue free
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
        <p class="merge-step__title">Step {{ currentStep }} · Active plan</p>
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
          Open dashboard
        </button>
        <button type="button" class="button button--secondary" @click="clearChosenAccess">
          Change access
        </button>
      </div>
    </div>

    <slot v-if="hasChosenAccess" :plan="portalAccess?.plan?.value" :service="currentService" />
  </section>
</template>

<style scoped>
/*
  The wrapper keeps the access controls visually separated from tool-specific
  form content, which makes the shared 3-step entry pattern easy to reuse.
*/
.service-flow-shell,
.service-flow-shell__copy,
.service-flow-shell__entry-actions {
  display: grid;
  gap: 1rem;
}

.service-flow-shell__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.service-flow-shell__step {
  display: flex;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.service-flow-shell__step--active {
  border-color: rgba(14, 116, 144, 0.26);
  box-shadow: 0 12px 24px rgba(14, 116, 144, 0.08);
}

.service-flow-shell__step--complete .service-flow-shell__index,
.service-flow-shell__step--active .service-flow-shell__index {
  background: #0f766e;
  color: #fff;
}

.service-flow-shell__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-weight: 700;
}

.service-flow-shell__copy {
  gap: 0.2rem;
}

.service-flow-shell__copy span {
  color: var(--ink-soft);
  font-size: 0.92rem;
}

.service-flow-shell__entry,
.service-flow-shell__status {
  gap: 1rem;
  border-color: rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
}

.service-flow-shell__buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .service-flow-shell__steps {
    grid-template-columns: 1fr;
  }

  .service-flow-shell__buttons > .button {
    width: 100%;
  }
}
</style>
