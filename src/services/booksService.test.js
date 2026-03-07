/*
  Books service tests pin the multipart request shape so the new DOCX editor
  stays aligned with the backend OpenAPI contract and task polling flow.
*/
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGreekLiteratureEditor } from "./booksService";

const uploadMultipartBinaryMock = vi.fn();

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  uploadMultipartBinary: (...args) => uploadMultipartBinaryMock(...args),
  unwrapFileName: (_headers, fallback) => `custom-${fallback}`,
  readOperationMessage: (_headers, fallback) => `msg-${fallback}`,
  readRequestId: () => "req-books-1",
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
  });

  it("applyGreekLiteratureEditor posts DOCX and editorOptions with task id", async () => {
    const progressSpy = vi.fn();
    const result = await applyGreekLiteratureEditor(
      "http://localhost:3000",
      mockFile,
      { ruleIds: ["kai_before_vowel", "sa_to_san"] },
      { taskId: "books-task-1", onUploadProgress: progressSpy }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/books/greek-editor/apply?taskId=books-task-1");
    expect(call.onUploadProgress).toBe(progressSpy);
    expect(call.formData.get("files")).toBeTruthy();
    expect(call.formData.get("editorOptions")).toContain("kai_before_vowel");
    expect(result.fileName).toBe("custom-manuscript-edited.docx");
    expect(result.requestId).toBe("req-books-1");
  });
});
