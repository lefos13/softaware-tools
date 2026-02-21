// This composable now runs an automated health guard loop so UI actions are blocked while API health is degraded.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getHealthStatus } from "../services/healthService";

const HEALTH_CHECK_INTERVAL_MS = 10000;

export const useHealthCheck = (baseUrlRef) => {
  const checking = ref(false);
  const hasChecked = ref(false);
  const isHealthy = ref(false);
  const status = ref("unknown");
  const message = ref("");
  const requestId = ref("");
  const error = ref("");
  const lastCheckedAt = ref("");

  let intervalId = null;

  const run = async () => {
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

  const restartLoop = () => {
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
