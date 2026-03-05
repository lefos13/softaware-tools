/*
  PDF service tests validate multipart payload composition and response mapping,
  ensuring merge/split/extract flows stay aligned with backend contracts.
*/
import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPdfToDocx, mergePdfFiles, splitPdfFile } from "./pdfService";

const uploadMultipartBinaryMock = vi.fn();

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  uploadMultipartBinary: (...args) => uploadMultipartBinaryMock(...args),
  unwrapFileName: (_headers, fallback) => `custom-${fallback}`,
  readOperationMessage: (_headers, fallback) => `msg-${fallback}`,
  readRequestId: () => "req-1",
}));

const mockFile = new Blob(["pdf"], { type: "application/pdf" });

describe("pdfService", () => {
  beforeEach(() => {
    uploadMultipartBinaryMock.mockReset();
    uploadMultipartBinaryMock.mockResolvedValue({
      blob: new Blob(["binary"]),
      headers: { get: vi.fn() },
    });
  });

  it("mergePdfFiles uploads files and merge plan with task id", async () => {
    const progressSpy = vi.fn();
    const result = await mergePdfFiles(
      "http://localhost:3000",
      [mockFile, mockFile],
      [{ sourceIndex: 0, rotation: 90 }],
      { taskId: "task-1", onUploadProgress: progressSpy }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/merge?taskId=task-1");
    expect(call.onUploadProgress).toBe(progressSpy);
    expect(call.formData.getAll("files")).toHaveLength(2);
    expect(call.formData.get("mergePlan")).toContain("rotation");
    expect(result.fileName).toBe("custom-merged.pdf");
    expect(result.requestId).toBe("req-1");
  });

  it("splitPdfFile sends split mode and options", async () => {
    const result = await splitPdfFile(
      "http://localhost:3000",
      mockFile,
      "range",
      { fromPage: 1, toPage: 2 },
      { taskId: "split-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/split?taskId=split-id");
    expect(call.formData.get("mode")).toBe("range");
    expect(call.formData.get("splitOptions")).toContain("fromPage");
    expect(result.fileName).toBe("custom-split-output.zip");
  });

  it("extractPdfToDocx posts extract options", async () => {
    const result = await extractPdfToDocx(
      "http://localhost:3000",
      mockFile,
      { ocrMode: "hybrid" },
      { taskId: "docx-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/extract-to-docx?taskId=docx-id");
    expect(call.formData.get("extractOptions")).toContain("ocrMode");
    expect(result.fileName).toBe("custom-extracted.docx");
  });
});
