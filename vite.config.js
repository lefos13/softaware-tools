// Added to enable Vue single-file component support with Vite for a fast local starter workflow.
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
