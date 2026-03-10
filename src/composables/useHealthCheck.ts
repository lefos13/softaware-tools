/*
  Health polling is centralized so the app shell and every flow can react to
  one consistent availability signal rather than scattering fetch loops and
  duplicated offline-state handling across individual views.
*/
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { getHealthStatus } from "../services/healthService";

const HEALTH_CHECK_INTERVAL_MS = 10000;

export const useHealthCheck = (baseUrlRef: Ref<string>) => {
  const checking = ref(false);
  const hasChecked = ref(false);
  const isHealthy = ref(false);
  const status = ref("unknown");
  const message = ref("");
  const requestId = ref("");
  const error = ref("");
  const lastCheckedAt = ref("");

  let intervalId: number | null = null;

  const run = async (): Promise<void> => {
    checking.value = true;
    error.value = "";

    try {
      const result = await getHealthStatus(baseUrlRef.value);
      status.value = result.status;
      message.value = result.message;
      requestId.value = result.requestId;
      isHealthy.value = String(result.status).toLowerCase() === "ok";
    } catch (runError) {
      status.value = "down";
      message.value = "Server unavailable";
      requestId.value = "";
      isHealthy.value = false;
      error.value = runError instanceof Error ? runError.message : "Could not reach API server";
    } finally {
      hasChecked.value = true;
      lastCheckedAt.value = new Date().toISOString();
      checking.value = false;
    }
  };

  const restartLoop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    void run();
    intervalId = window.setInterval(() => {
      void run();
    }, HEALTH_CHECK_INTERVAL_MS);
  };

  watch(
    () => baseUrlRef.value,
    () => {
      restartLoop();
    }
  );

  onMounted(() => {
    restartLoop();
  });

  onBeforeUnmount(() => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  return {
    checking,
    hasChecked,
    isHealthy,
    status,
    message,
    requestId,
    error,
    lastCheckedAt,
    run,
  };
};
