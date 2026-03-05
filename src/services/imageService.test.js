/*
  Image service tests validate request payload composition and result metadata
  for compression, conversion, and preview endpoints.
*/
import { beforeEach, describe, expect, it, vi } from "vitest";
import { compressImages, convertImagePreview, convertImages } from "./imageService";

const uploadMultipartBinaryMock = vi.fn();

vi.mock("./apiClient", () => ({
  buildUrl: (base, path) => `${base}${path}`,
  uploadMultipartBinary: (...args) => uploadMultipartBinaryMock(...args),
  unwrapFileName: (_headers, fallback) => `custom-${fallback}`,
  readOperationMessage: (_headers, fallback) => `msg-${fallback}`,
  readRequestId: () => "req-1",
}));

const mockImage = new Blob(["img"], { type: "image/png" });

describe("imageService", () => {
  beforeEach(() => {
    uploadMultipartBinaryMock.mockReset();
    uploadMultipartBinaryMock.mockResolvedValue({
      blob: new Blob(["binary"]),
      headers: { get: vi.fn() },
    });
  });

  it("compressImages sends mode and optional advanced options", async () => {
    const result = await compressImages(
      "http://localhost:3000",
      [mockImage, mockImage],
      "advanced",
      { quality: 85 },
      { taskId: "img-task" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/image/compress?taskId=img-task");
    expect(call.formData.getAll("files")).toHaveLength(2);
    expect(call.formData.get("mode")).toBe("advanced");
    expect(call.formData.get("advancedOptions")).toContain("quality");
    expect(result.fileName).toBe("custom-compressed-images.zip");
  });

  it("convertImages sends target format and conversion options", async () => {
    const result = await convertImages(
      "http://localhost:3000",
      [mockImage],
      "webp",
      { transparentBackground: true },
      { taskId: "conv-task" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/image/convert?taskId=conv-task");
    expect(call.formData.get("targetFormat")).toBe("webp");
    expect(call.formData.get("conversionOptions")).toContain("transparentBackground");
    expect(result.fileName).toBe("custom-converted-images-webp.zip");
  });

  it("convertImagePreview maps default extension by target format", async () => {
    const result = await convertImagePreview(
      "http://localhost:3000",
      mockImage,
      "jpeg",
      { quality: 80 },
      { taskId: "preview-task" }
    );

    const call = uploadMultipartBinaryMock.mock.calls[0][0];
    expect(call.url).toBe("http://localhost:3000/api/image/convert-preview?taskId=preview-task");
    expect(call.formData.get("targetFormat")).toBe("jpeg");
    expect(result.fileName).toBe("custom-converted-preview.jpg");
  });
});
