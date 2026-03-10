/*
  API client tests validate URL utilities, error parsing, header extraction,
  and multipart upload behavior because all tool services depend on them.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadMultipartBinaryParams } from "./apiClient";
import {
  buildUrl,
  parseApiError,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";

const asResponse = (value: Partial<Response>): Response => value as Response;

type TriggerLoadParams = {
  status: number;
  bodyText?: string;
  blobText?: string;
  headers?: Record<string, string>;
};

const createdXhrs: MockXhr[] = [];

class MockXhr {
  headers: Record<string, string>;
  upload: { onprogress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void };
  status: number;
  response: Blob | null;
  responseType: XMLHttpRequestResponseType;
  onload: null | (() => void);
  onerror: null | (() => void);
  method: string;
  url: string;
  sentBody: Document | XMLHttpRequestBodyInit | null;
  responseHeaders: Record<string, string>;

  constructor() {
    this.headers = {};
    this.upload = {};
    this.status = 0;
    this.response = null;
    this.responseType = "";
    this.onload = null;
    this.onerror = null;
    this.method = "";
    this.url = "";
    this.sentBody = null;
    this.responseHeaders = {};
    createdXhrs.push(this);
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  getResponseHeader(name: string): string | null {
    return this.responseHeaders[name] || null;
  }

  send(body: Document | XMLHttpRequestBodyInit | null): void {
    this.sentBody = body;
  }

  triggerLoad({ status, bodyText = "", blobText = "", headers = {} }: TriggerLoadParams): void {
    this.status = status;
    this.responseHeaders = headers;
    if (status >= 200 && status < 300) {
      this.response = new Blob([blobText || "binary"]);
    } else {
      this.response = new Blob([bodyText]);
    }

    this.onload?.();
  }

  triggerError(): void {
    this.onerror?.();
  }
}

describe("apiClient", () => {
  beforeEach(() => {
    createdXhrs.length = 0;
    vi.stubGlobal("XMLHttpRequest", MockXhr);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("buildUrl trims trailing slash from base url", () => {
    expect(buildUrl("http://localhost:3000/", "/api/health")).toBe(
      "http://localhost:3000/api/health"
    );
  });

  it("parseApiError includes code details and request id", async () => {
    const response = asResponse({
      status: 400,
      ok: false,
      json: async () => ({
        error: {
          code: "INVALID_INPUT",
          message: "Input invalid",
          details: [{ field: "name", issue: "Required" }],
        },
        meta: { requestId: "req-1" },
      }),
    });

    await expect(parseApiError(response)).resolves.toBe(
      "INVALID_INPUT: Input invalid (name: Required) [ref: req-1]"
    );
  });

  it("parseApiError falls back when json cannot be parsed", async () => {
    const response = asResponse({
      status: 502,
      ok: false,
      json: async () => {
        throw new Error("broken");
      },
    });

    await expect(parseApiError(response)).resolves.toBe("Request failed with status 502");
  });

  it("unwrapFileName gets filename from content disposition", () => {
    const headers = {
      get: vi.fn(() => 'attachment; filename="result.pdf"'),
    };

    expect(unwrapFileName(headers, "fallback.pdf")).toBe("result.pdf");
  });

  it("unwrapFileName decodes UTF-8 filename* values", () => {
    const headers = {
      get: vi.fn(
        () =>
          "attachment; filename=\"manuscript-edited.docx\"; filename*=UTF-8''%CE%BA%CE%B5%CE%AF%CE%BC%CE%B5%CE%BD%CE%BF-edited.docx"
      ),
    };

    expect(unwrapFileName(headers, "fallback.docx")).toBe("κείμενο-edited.docx");
  });

  it("unwrapFileName repairs mojibake plain filename values", () => {
    const headers = {
      get: vi.fn(
        () =>
          'attachment; filename="Î¤Î Î ÎÎ Î¡Î©ÎÎÎÎ Î¤ÎÎ¥ Î¡ÎÎ - ÎÎ»Î¿ÎºÎ»Î·ÏÏÎ¼ÎµÌÎ½Î¿-edited.docx"'
      ),
    };

    expect(unwrapFileName(headers, "fallback.docx")).toBe(
      "ΤΟ ΠΕΠΡΩΜΕΝΟ ΤΟΥ ΡΑΘ - Ολοκληρωμένο-edited.docx"
    );
  });

  it("reads operation and request headers", () => {
    const headers = {
      get: vi.fn((key) => {
        if (key === "x-operation-message") return "Done";
        if (key === "x-request-id") return "abc";
        return null;
      }),
    };

    expect(readOperationMessage(headers, "fallback")).toBe("Done");
    expect(readRequestId(headers)).toBe("abc");
  });

  it("uploadMultipartBinary resolves with blob and headers on success", async () => {
    const progressSpy = vi.fn();
    const request = uploadMultipartBinary({
      url: "http://localhost/upload",
      formData: new FormData(),
      onUploadProgress: progressSpy,
      headers: { "x-request-id": "abc" },
    } satisfies UploadMultipartBinaryParams);

    const xhr = createdXhrs[0];
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 10,
      total: 20,
    } as ProgressEvent<XMLHttpRequestEventTarget>);
    xhr.triggerLoad({
      status: 200,
      blobText: "ok",
      headers: {
        "content-disposition": 'attachment; filename="file.bin"',
      },
    });

    const result = await request;
    expect(result.status).toBe(200);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.headers.get("content-disposition")).toContain("filename");
    expect(progressSpy).toHaveBeenCalledOnce();
    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("http://localhost/upload");
    expect(xhr.headers["x-request-id"]).toBe("abc");
  });

  it("uploadMultipartBinary rejects with parsed API error on failure", async () => {
    const request = uploadMultipartBinary({
      url: "http://localhost/upload",
      formData: new FormData(),
    } satisfies UploadMultipartBinaryParams);

    const xhr = createdXhrs[0];
    xhr.triggerLoad({
      status: 400,
      bodyText: JSON.stringify({
        error: { code: "BAD_REQUEST", message: "Invalid payload" },
      }),
    });

    await expect(request).rejects.toThrow("BAD_REQUEST: Invalid payload");
  });

  it("uploadMultipartBinary rejects on network errors", async () => {
    const request = uploadMultipartBinary({
      url: "http://localhost/upload",
      formData: new FormData(),
    } satisfies UploadMultipartBinaryParams);

    const xhr = createdXhrs[0];
    xhr.triggerError();

    await expect(request).rejects.toThrow("Network error while sending request");
  });
});
