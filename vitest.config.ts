/*
  Dedicated test configuration keeps unit tests fast and deterministic in Node
  while covering service modules without requiring browser runtime.
*/
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
