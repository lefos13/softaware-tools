/// <reference types="vite/client" />

/*
  Front-end modules import Vue SFCs, worker URLs, and build-time env flags
  directly, so these declarations keep strict TypeScript compatible with the
  existing Vite loading model instead of widening everything to any.
*/
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_BOOKS_SERVICES?: string;
  readonly VITE_ENABLE_JSON_SERVICES?: string;
  readonly VITE_MAX_FILE_SIZE_MB?: string;
  readonly VITE_MAX_TOTAL_UPLOAD_MB?: string;
  readonly VITE_MAX_UPLOAD_FILES?: string;
  readonly VITE_PAYPAL_DONATE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
