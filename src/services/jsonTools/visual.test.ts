/*
  Visual renderer tests validate browser-free image generation flow by mocking
  canvas APIs required by JSON image and screenshot tools.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderJsonAsImage } from "./visual";

interface CanvasContextMock {
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  quadraticCurveTo: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  measureText: (text: string) => { width: number };
  fillText: ReturnType<typeof vi.fn>;
}

interface CanvasElementMock {
  width: number;
  height: number;
  getContext: () => CanvasContextMock;
  toBlob: (callback: BlobCallback) => void;
}

describe("jsonTools visual", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const fillText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL });
    vi.stubGlobal("document", {
      createElement: vi.fn(
        (): CanvasElementMock => ({
          width: 0,
          height: 0,
          getContext: (): CanvasContextMock => ({
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            closePath: vi.fn(),
            fillRect: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            measureText: (text) => ({ width: String(text).length * 7 }),
            fillText,
          }),
          toBlob: (cb: BlobCallback) => cb(new Blob(["png"], { type: "image/png" })),
        })
      ),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    createObjectURL.mockClear();
    fillText.mockClear();
  });

  it("renders json to image output", async () => {
    const result = await renderJsonAsImage({
      toolId: "json-to-image",
      input: '{"a":1}',
      options: { theme: "light", fontSize: 14 },
    });

    expect(result.outputUrl).toBe("blob:mock-url");
    expect(result.extension).toBe("png");
    expect(result.outputBlob).toBeInstanceOf(Blob);
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("fails with a clear error when canvas export returns null blob", async () => {
    vi.stubGlobal("document", {
      createElement: vi.fn(
        (): CanvasElementMock => ({
          width: 0,
          height: 0,
          getContext: (): CanvasContextMock => ({
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            closePath: vi.fn(),
            fillRect: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            measureText: (text) => ({ width: String(text).length * 7 }),
            fillText: vi.fn(),
          }),
          toBlob: (cb: BlobCallback) => cb(null),
        })
      ),
    });

    await expect(
      renderJsonAsImage({
        toolId: "json-to-image",
        input: '{"a":1}',
      })
    ).rejects.toThrow("Could not export image from canvas");
  });
});
