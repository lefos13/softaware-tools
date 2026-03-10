/*
  Service-layer request and response contracts are shared by composables and
  views, so keeping them centralized prevents each flow from retyping backend
  payloads differently while the migration moves to strict TypeScript.
*/
import type {
  AccessDashboardData,
  AccessPlan,
  AccessPlanServiceStatus,
  BinaryResponse,
  ServiceKey,
  UploadProgressEvent,
} from "./shared";

export interface ServiceRequestOptions {
  serviceToken?: string;
  taskId?: string;
  flowSessionId?: string;
  onUploadProgress?: (event: UploadProgressEvent) => void;
}

export interface AccessDashboardQuery {
  page?: number;
  limit?: number;
  serviceKey?: ServiceKey;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface AccessTokenRecord {
  tokenId: string;
  alias?: string;
  token?: string;
  tokenType?: string;
  expiresAt?: string;
  usageResetAt?: string;
  isRevoked?: boolean;
  isExpired?: boolean;
  isActive?: boolean;
  renewedAt?: string;
  extendedAt?: string;
  servicePolicies?: Record<string, string>;
  usageSummary?: Array<{
    serviceKey: ServiceKey;
    quota?: {
      requests?: {
        used: number;
        limit: number | null;
        remaining: number;
      };
      words?: {
        used: number;
        limit: number | null;
        remaining: number;
      };
    };
  }>;
  [key: string]: unknown;
}

export interface ListAccessTokensData {
  count: number;
  tokens: AccessTokenRecord[];
  availableServicePolicies?: Record<string, Record<string, unknown>>;
  availableServiceFlags?: string[];
}

export interface AccessTokenMutationPayload {
  alias?: string;
  ttl?: string;
  servicePolicies?: Record<string, string>;
}

export interface AccessTokenMutationResult {
  token?: string;
  record?: AccessTokenRecord | null;
}

export interface GreekEditorAccessResult {
  authEnabled: boolean;
  token: AccessTokenRecord | null;
  message: string;
  requestId: string;
}

export interface GreekEditorTextResult {
  correctedText: string;
  summary: GreekEditorReportSummary;
  report: GreekEditorReportData | null;
  reportText: string;
  message: string;
  requestId: string;
}

export interface GreekEditorPreviewResult {
  summary: GreekEditorReportSummary;
  report: GreekEditorReportData | null;
  reportText: string;
  message: string;
  requestId: string;
}

export interface GreekEditorReportSummary {
  totalReplacements?: number;
  changedParagraphs?: number;
  [key: string]: unknown;
}

export interface GreekEditorReportChange {
  ruleId: string;
  before?: string;
  after?: string;
  sentenceBefore?: string;
  sentenceAfter?: string;
  [key: string]: unknown;
}

export interface GreekEditorReportData {
  summary?: GreekEditorReportSummary;
  changes?: GreekEditorReportChange[];
  [key: string]: unknown;
}

export interface HealthStatus {
  status: string;
  message: string;
  requestId: string;
  lastCheckedAt?: string;
}

export interface TaskProgress {
  progress?: number;
  progressPercent?: number;
  step?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AccessPlanResult extends AccessPlan {}

export interface AccessDashboardTokenSummary {
  alias?: string;
  expiresAt?: string;
  serviceFlags?: string[];
  [key: string]: unknown;
}

export interface AccessDashboardHistoryRow {
  eventId?: string;
  createdAt?: string;
  operationName?: string;
  serviceKey?: ServiceKey;
  status?: string;
  consumedRequests?: number;
  consumedWords?: number;
  [key: string]: unknown;
}

export interface AccessDashboardResult extends AccessDashboardData {
  token?: AccessDashboardTokenSummary | null;
  services?: NonNullable<AccessDashboardData["services"]>;
  history?: {
    total?: number;
    items?: AccessDashboardHistoryRow[];
  } | null;
}

export type BinaryServiceResult = BinaryResponse;

export interface ServiceFlowShellContext {
  setLoading: (value: boolean) => void;
  setHasResult: (value: boolean) => void;
}

export interface PdfMergePreviewEntry {
  id: number;
  sourceIndex: number;
  name: string;
  size: number;
  rotation: number;
  file: File;
  previewUrl: string;
}

export interface CurrentAccessService extends AccessPlanServiceStatus {}
