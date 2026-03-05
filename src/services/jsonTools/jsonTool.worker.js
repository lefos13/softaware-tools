/*
  Worker execution keeps CPU-heavy JSON transformations off the main thread
  so the shared workspace remains responsive during large operations.
*/
import { runJsonTool } from "./engine/index";

self.onmessage = (event) => {
  const { requestId, payload } = event.data;
  const result = runJsonTool(payload);
  self.postMessage({ requestId, result });
};
