// Added as the Vue entrypoint so the portal can mount quickly and remain easy to expand feature-by-feature.
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
