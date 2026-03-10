/*
  Worker execution keeps CPU-heavy JSON transformations off the main thread
  so the shared workspace remains responsive during large operations.
*/
import type { JsonToolRunRequest, JsonToolRunResult } from "../../types/jsonTools";
import { runJsonTool } from "./engine/index";

interface JsonToolWorkerMessage {
  requestId: string;
  payload: JsonToolRunRequest;
}

interface JsonToolWorkerResponse {
  requestId: string;
  result: JsonToolRunResult;
}

self.onmessage = (event: MessageEvent<JsonToolWorkerMessage>) => {
  const { requestId, payload } = event.data;
  const result = runJsonTool(payload);
  self.postMessage({ requestId, result } satisfies JsonToolWorkerResponse);
};
