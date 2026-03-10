import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  /*
    Swagger UI ships a very large prebuilt ESM bundle. Raising the warning
    threshold keeps production builds focused on actionable regressions while
    still allowing this route-level chunk to stay lazily loaded.
  */
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
