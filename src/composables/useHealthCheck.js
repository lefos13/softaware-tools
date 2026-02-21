// This composable now tracks backend response message + request id so health checks give user-facing status and support context.
import { ref } from "vue";
import { getHealthStatus } from "../services/healthService";

export const useHealthCheck = () => {
  const loading = ref(false);
  const status = ref("");
  const message = ref("");
  const requestId = ref("");
  const error = ref("");

  const run = async (baseUrl) => {
    loading.value = true;
    status.value = "";
    message.value = "";
    requestId.value = "";
    error.value = "";

    try {
      const result = await getHealthStatus(baseUrl);
      status.value = result.status;
      message.value = result.message;
      requestId.value = result.requestId;
    } catch (runError) {
      error.value = runError instanceof Error ? runError.message : "Could not reach API server";
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    status,
    message,
    requestId,
    error,
    run,
  };
};
