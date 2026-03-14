/*
  Shared API, routing, and view-model contracts centralize the shapes reused
  across services, composables, and Vue injections so strict typing can scale
  without each module redefining the same payloads inconsistently.
*/
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from "vue";

export type LocaleCode = "en" | "el";

export type ServiceKey = "books_greek_editor" | "image" | "json" | "pdf" | "tasks" | (string & {});

export type PlanType = "free" | "token";

export interface ApiErrorDetail {
  field?: string;
  issue?: string;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
  meta?: {
    requestId?: string;
  };
}

export interface ApiEnvelope<TData> {
  data?: TData | null;
  message?: string;
  meta?: {
    requestId?: string;
  };
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  ratio: number;
}

export interface BinaryResponse {
  blob: Blob;
  fileName: string;
  message: string;
  requestId: string;
}

export interface UploadMultipartResult {
  blob: Blob;
  headers: {
    get: (name: string) => string | null;
  };
  status: number;
}

export interface QuotaSummary {
  limit: number | null;
  used: number;
  remaining: number;
}

export interface UsageSummaryItem {
  serviceKey: ServiceKey;
  quota?: {
    requests?: QuotaSummary;
    words?: QuotaSummary;
  };
}

export interface AccessPricingItem {
  serviceKey: ServiceKey;
  preset: string;
  amount: number;
  currency: string;
  billingMode: string;
}

export interface AccessPricingSummary {
  totalAmount: number;
  currency: string;
  billingMode: string;
  items: AccessPricingItem[];
}

export interface AccessPlanServiceStatus {
  serviceKey: ServiceKey;
  enabled?: boolean;
  quota?: {
    requests?: QuotaSummary;
    words?: QuotaSummary;
  };
  [key: string]: unknown;
}

export interface AccessPlan {
  planType: PlanType;
  token?: {
    alias?: string;
    tokenId?: string;
    expiresAt?: string;
    serviceFlags?: string[];
    pricing?: AccessPricingSummary | null;
  } | null;
  enabledServices: ServiceKey[];
  services?: AccessPlanServiceStatus[];
  usageSummary?: UsageSummaryItem[];
  [key: string]: unknown;
}

export interface AccessDashboardHistoryItem {
  requestId?: string;
  createdAt?: string;
  operation?: string;
  serviceKey?: ServiceKey;
  status?: string;
  [key: string]: unknown;
}

export interface AccessDashboardData {
  services?: UsageSummaryItem[];
  history?: {
    total?: number;
    items?: AccessDashboardHistoryItem[];
  } | null;
  [key: string]: unknown;
}

export interface PortalAccessStore {
  activeToken: Ref<string>;
  plan: Ref<AccessPlan | null>;
  loading: Ref<boolean>;
  error: Ref<string>;
  initialized: Ref<boolean>;
  planType: ComputedRef<PlanType>;
  enabledServices: ComputedRef<ServiceKey[]>;
  validateToken: (token: string) => Promise<AccessPlan | null>;
  refreshPlan: (
    serviceToken?: string,
    options?: { persist?: boolean }
  ) => Promise<AccessPlan | null>;
  startFreePlan: () => Promise<AccessPlan | null>;
  logout: () => Promise<AccessPlan | null>;
}

export interface PortalContext {
  apiBaseUrl: Ref<string>;
  checking: Ref<boolean>;
  hasChecked: Ref<boolean>;
  isHealthy: Ref<boolean>;
  status: Ref<string>;
  message: Ref<string>;
  requestId: Ref<string>;
  error: Ref<string>;
  lastCheckedAt: Ref<string>;
}

export interface PortalI18n {
  locale: Ref<LocaleCode>;
  messages: Record<LocaleCode, Record<string, unknown>>;
  t: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
  setLocale: (locale: LocaleCode) => void;
  formatDate: (value?: string | number | Date | null) => string;
  formatTime: (value?: string | number | Date | null) => string;
}

export type RouteName =
  | "home"
  | "plans"
  | "dashboard"
  | "pdf-services"
  | "pdf"
  | "pdf-split"
  | "pdf-extract-to-word"
  | "pdf-watermark"
  | "pdf-page-numbers"
  | "pdf-edit-pages"
  | "pdf-extract-text"
  | "pdf-from-images"
  | "books-services"
  | "books-greek-editor"
  | "image-services"
  | "image"
  | "image-convert"
  | "json-services"
  | "json-tool"
  | "contract"
  | "admin-tokens"
  | "donate";

export interface RouteParams {
  toolId?: string;
}

export interface PortalRoute {
  path: string;
  name: RouteName;
  label: string;
  component: unknown;
  matcher?: (path: string) => RouteParams | null;
}

export interface PortalRouter {
  routes: PortalRoute[];
  currentPath: Ref<string>;
  currentRoute: ComputedRef<PortalRoute>;
  currentRouteParams: ComputedRef<RouteParams>;
  currentComponent: ComputedRef<unknown>;
  navigate: (path: string) => void;
  dispose: () => void;
}

export interface TaskProgressData {
  requestId?: string;
  percent?: number;
  progressPercent?: number;
  label?: string;
  progressLabel?: string;
  status?: string;
  [key: string]: unknown;
}

export type WritableComputedRef<TValue> = ComputedRef<TValue> & {
  readonly value: TValue;
};

export const PORTAL_CONTEXT_KEY = "portalContext";
export const PORTAL_ROUTER_KEY = "portalRouter";
export const PORTAL_ACCESS_KEY = "portalAccess";

export const portalContextKey = PORTAL_CONTEXT_KEY as unknown as InjectionKey<PortalContext>;
export const portalRouterKey = PORTAL_ROUTER_KEY as unknown as InjectionKey<PortalRouter>;
export const portalAccessKey = PORTAL_ACCESS_KEY as unknown as InjectionKey<PortalAccessStore>;

export type TemplateRef<TElement> = ShallowRef<TElement | null>;
