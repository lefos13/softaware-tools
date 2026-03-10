/*
  The portal access store keeps one validated token session and one shared
  plan payload so service screens can switch between free and paid usage.
*/
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import {
  ACCESS_USAGE_UPDATED_EVENT,
  readActiveServiceToken,
  writeActiveServiceToken,
} from "../services/accessClientState";
import { fetchAccessPlan } from "../services/accessPlanService";
import type { PortalAccessStore } from "../types/shared";
import type { AccessPlanResult } from "../types/services";

interface ResolvePlanOptions {
  persist?: boolean;
}

export const usePortalAccess = (apiBaseUrl: Ref<string>): PortalAccessStore => {
  const activeToken = ref(readActiveServiceToken());
  const plan = ref<AccessPlanResult | null>(null);
  const loading = ref(false);
  const error = ref("");
  const initialized = ref(false);

  const resolvePlan = async (
    serviceToken = activeToken.value,
    { persist = true }: ResolvePlanOptions = {}
  ): Promise<AccessPlanResult | null> => {
    loading.value = true;
    error.value = "";

    try {
      const data = await fetchAccessPlan(apiBaseUrl.value, serviceToken);
      plan.value = data;
      activeToken.value = String(serviceToken || "").trim();
      if (persist) {
        writeActiveServiceToken(activeToken.value);
      }
      return data;
    } catch (caughtError) {
      const hadToken = Boolean(String(serviceToken || "").trim());
      if (hadToken) {
        activeToken.value = "";
        writeActiveServiceToken("");
      }
      if (!hadToken) {
        plan.value = null;
      }
      error.value =
        caughtError instanceof Error ? caughtError.message : "Could not resolve the access plan.";
      throw caughtError;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  const startFreePlan = async () => {
    activeToken.value = "";
    writeActiveServiceToken("");
    return resolvePlan("", { persist: false });
  };

  const validateToken = async (token: string) => {
    return resolvePlan(token, { persist: true });
  };

  const logout = async () => {
    return startFreePlan();
  };

  const onUsageUpdated = () => {
    if (!initialized.value) {
      return;
    }

    void resolvePlan(activeToken.value, { persist: false }).catch(() => {});
  };

  onMounted(() => {
    window.addEventListener(ACCESS_USAGE_UPDATED_EVENT, onUsageUpdated);
    void resolvePlan(activeToken.value, { persist: true }).catch(async () => {
      if (activeToken.value) {
        await startFreePlan().catch(() => {});
        return;
      }

      initialized.value = true;
    });
  });

  onBeforeUnmount(() => {
    window.removeEventListener(ACCESS_USAGE_UPDATED_EVENT, onUsageUpdated);
  });

  return {
    activeToken,
    plan,
    loading,
    error,
    initialized,
    planType: computed(() => plan.value?.planType || "free"),
    enabledServices: computed(() => plan.value?.enabledServices || []),
    validateToken,
    refreshPlan: resolvePlan,
    startFreePlan,
    logout,
  };
};
