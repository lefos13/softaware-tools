/*
  Books service tests pin both the multipart DOCX contract and the JSON text
  contract so frontend requests stay aligned with backend OpenAPI docs and the
  protected editor token header.
*/
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyGreekLiteratureEditor,
  applyGreekLiteratureEditorText,
  previewGreekLiteratureEditorReport,
  validateGreekLiteratureEditorAccess,
} from "./booksService";

const uploadMultipartBinaryMock = vi.fn();

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  uploadMultipartBinary: (...args) => uploadMultipartBinaryMock(...args),
  unwrapFileName: (_headers, fallback) => `custom-${fallback}`,
  readOperationMessage: (_headers, fallback) => `msg-${fallback}`,
  readRequestId: () => "req-books-1",
  parseApiError: vi.fn(async () => "BOOKS_ERROR: request failed"),
}));

const mockFile = new Blob(["docx"], {
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});

describe("booksService", () => {
  beforeEach(() => {
    uploadMultipartBinaryMock.mockReset();
    uploadMultipartBinaryMock.mockResolvedValue({
      blob: new Blob(["binary"]),
      headers: { get: vi.fn() },
    });
    global.fetch = vi.fn();
  });

  it("applyGreekLiteratureEditor posts DOCX and editorOptions with task id", async () => {
    const progressSpy = vi.fn();
    const result = await applyGreekLiteratureEditor(
      "http://localhost:3000",
      mockFile,
      {
        ruleIds: ["kai_before_vowel", "sa_to_san"],
        includeReport: true,
        preferences: { andrasStyle: "antras", avgoStyle: "avgo" },
      },
      {
        taskId: "books-task-1",
        flowSessionId: "books-flow-1",
        onUploadProgress: progressSpy,
        serviceToken: "svc-token",
      }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe(
      "http://localhost:3000/api/books/greek-editor/apply?taskId=books-task-1&flowSessionId=books-flow-1"
    );
    expect(call.onUploadProgress).toBe(progressSpy);
    expect(call.headers).toEqual({ "x-service-token": "svc-token" });
    expect(call.formData.get("files")).toBeTruthy();
    expect(call.formData.get("editorOptions")).toContain("kai_before_vowel");
    expect(call.formData.get("editorOptions")).toContain("includeReport");
    expect(result.fileName).toBe("custom-manuscript-edited.docx");
    expect(result.requestId).toBe("req-books-1");
  });

  it("validateGreekLiteratureEditorAccess sends the editor token and returns session data", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: "token-ok",
        data: {
          authEnabled: true,
          token: {
            tokenId: "token-1",
            alias: "Books editor token",
            serviceFlags: ["books_greek_editor"],
            expiresAt: "2026-04-01T00:00:00.000Z",
          },
        },
        meta: { requestId: "req-access-1" },
      }),
    });

    const result = await validateGreekLiteratureEditorAccess("http://localhost:3000", "svc-token");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/books/greek-editor/access",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
          "x-service-token": "svc-token",
        }),
      })
    );
    expect(result.authEnabled).toBe(true);
    expect(result.token?.alias).toBe("Books editor token");
    expect(result.requestId).toBe("req-access-1");
  });

  it("applyGreekLiteratureEditorText posts JSON and returns corrected text payload", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: "text-success",
        data: {
          correctedText: "σαν λύκος...",
          summary: { totalReplacements: 2 },
          report: { changes: [{ before: "σα", after: "σαν" }] },
          reportText: "Detailed changes:",
        },
        meta: { requestId: "req-text-1" },
      }),
    });

    const result = await applyGreekLiteratureEditorText(
      "http://localhost:3000",
      "σα λύκος.....",
      {
        ruleIds: ["sa_to_san", "ellipsis_normalize"],
        includeReport: true,
      },
      { taskId: "books-task-2", flowSessionId: "books-flow-2", serviceToken: "svc-token" }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/books/greek-editor/apply-text?taskId=books-task-2&flowSessionId=books-flow-2",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-service-token": "svc-token",
        }),
      })
    );
    expect(result.correctedText).toBe("σαν λύκος...");
    expect(result.reportText).toBe("Detailed changes:");
    expect(result.requestId).toBe("req-text-1");
  });

  it("previewGreekLiteratureEditorReport posts multipart and returns JSON report data", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: "preview-success",
        data: {
          summary: { totalReplacements: 3 },
          report: { changes: [{ before: "σα", after: "σαν" }] },
          reportText: "Αναφορά λογοτεχνικής επιμέλειας",
        },
        meta: { requestId: "req-preview-1" },
      }),
    });

    const result = await previewGreekLiteratureEditorReport(
      "http://localhost:3000",
      mockFile,
      {
        ruleIds: ["sa_to_san"],
        includeReport: true,
      },
      { taskId: "books-task-3", flowSessionId: "books-flow-3", serviceToken: "svc-token" }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/books/greek-editor/preview-report?taskId=books-task-3&flowSessionId=books-flow-3",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "x-service-token": "svc-token",
        }),
      })
    );
    expect(result.summary.totalReplacements).toBe(3);
    expect(result.reportText).toBe("Αναφορά λογοτεχνικής επιμέλειας");
    expect(result.requestId).toBe("req-preview-1");
  });
});
