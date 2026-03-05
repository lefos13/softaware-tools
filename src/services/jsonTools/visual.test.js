/*
  Visual renderer tests validate browser-free image generation flow by mocking
  DOM/canvas APIs that are required by JSON image and screenshot tools.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderJsonAsImage } from "./visual";

describe("jsonTools visual", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const revokeObjectURL = vi.fn();

  class MockImage {
    set src(_value) {
      setTimeout(() => this.onload?.(), 0);
    }
  }

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("document", {
      createElement: vi.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (cb) => cb(new Blob(["png"], { type: "image/png" })),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
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
});
