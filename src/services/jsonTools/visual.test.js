/*
  Visual renderer tests validate browser-free image generation flow by mocking
  canvas APIs required by JSON image and screenshot tools.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderJsonAsImage } from "./visual";

describe("jsonTools visual", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const fillText = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
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
        toBlob: (cb) => cb(new Blob(["png"], { type: "image/png" })),
      })),
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
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({
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
        toBlob: (cb) => cb(null),
      })),
    });

    await expect(
      renderJsonAsImage({
        toolId: "json-to-image",
        input: '{"a":1}',
      })
    ).rejects.toThrow("Could not export image from canvas");
  });
});
