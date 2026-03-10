/*
  PDF service tests validate multipart payload composition and response mapping,
  ensuring merge/split/extract flows stay aligned with backend contracts.
*/
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadMultipartBinaryParams } from "./apiClient";
import {
  addPdfPageNumbers,
  editPdfPages,
  extractPdfText,
  extractPdfToDocx,
  mergePdfFiles,
  pdfFromImages,
  splitPdfFile,
  watermarkPdf,
} from "./pdfService";

const uploadMultipartBinaryMock =
  vi.fn<
    (params: UploadMultipartBinaryParams) => Promise<{ blob: Blob; headers: Pick<Headers, "get"> }>
  >();

vi.mock("./apiClient", () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
  uploadMultipartBinary: (...args: Parameters<typeof uploadMultipartBinaryMock>) =>
    uploadMultipartBinaryMock(...args),
  unwrapFileName: (_headers: Pick<Headers, "get">, fallback: string) => `custom-${fallback}`,
  readOperationMessage: (_headers: Pick<Headers, "get">, fallback: string) => `msg-${fallback}`,
  readRequestId: () => "req-1",
}));

const mockFile = new File([new Blob(["pdf"])], "sample.pdf", { type: "application/pdf" });

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

  it("watermarkPdf sends optional watermark image and options", async () => {
    const watermarkImage = new Blob(["img"], { type: "image/png" });
    const result = await watermarkPdf(
      "http://localhost:3000",
      mockFile,
      { mode: "text", text: "DRAFT" },
      watermarkImage,
      { taskId: "wm-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/watermark?taskId=wm-id");
    expect(call.formData.get("watermarkOptions")).toContain("DRAFT");
    expect(call.formData.get("watermarkImage")).toBeTruthy();
    expect(result.fileName).toBe("custom-watermarked.pdf");
  });

  it("addPdfPageNumbers sends pageNumberOptions payload", async () => {
    const result = await addPdfPageNumbers(
      "http://localhost:3000",
      mockFile,
      { mode: "bates", prefix: "CASE-" },
      { taskId: "num-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/page-numbers?taskId=num-id");
    expect(call.formData.get("pageNumberOptions")).toContain("CASE-");
    expect(result.fileName).toBe("custom-numbered.pdf");
  });

  it("editPdfPages sends required editPlan payload", async () => {
    const result = await editPdfPages(
      "http://localhost:3000",
      mockFile,
      { delete: [2], reorder: [1, 3] },
      { taskId: "edit-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/edit-pages?taskId=edit-id");
    expect(call.formData.get("editPlan")).toContain("delete");
    expect(result.fileName).toBe("custom-edited.pdf");
  });

  it("extractPdfText sends optional textExtractOptions payload", async () => {
    const result = await extractPdfText(
      "http://localhost:3000",
      mockFile,
      { perPageZip: true },
      { taskId: "text-id" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/extract-text?taskId=text-id");
    expect(call.formData.get("textExtractOptions")).toContain("perPageZip");
    expect(result.fileName).toBe("custom-extracted.txt");
  });

  it("pdfFromImages uploads image files to generate PDF", async () => {
    const mockImage = new File([new Blob(["img"])], "image.png", { type: "image/png" });
    const result = await pdfFromImages("http://localhost:3000", [mockImage], {
      taskId: "img-pdf-id",
    });

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/pdf/from-images?taskId=img-pdf-id");
    expect(call.formData.getAll("files")).toHaveLength(1);
    expect(result.fileName).toBe("custom-from-images.pdf");
  });
});
