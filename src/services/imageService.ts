/*
  Image upload helpers mirror the PDF/books clients so compression, archive
  conversion, and preview generation all share the same binary response and
  task-progress contract while the UI migrates to strict TypeScript.
*/
import {
  buildUrl,
  readOperationMessage,
  readRequestId,
  unwrapFileName,
  uploadMultipartBinary,
} from "./apiClient";
import { emitAccessUsageUpdated, readActiveServiceToken } from "./accessClientState";
import type { BinaryServiceResult, ServiceRequestOptions } from "../types/services";

interface ImageAdvancedOptions {
  quality?: number;
  format?: string;
  maxWidth?: number;
  maxHeight?: number;
  effort?: number;
  lossless?: boolean;
  transparentBackground?: boolean;
  colorTolerance?: number;
  backgroundDetectionMode?: string;
  pickerPoints?: Array<{ x: number; y: number }>;
}

const buildServiceHeaders = (serviceToken?: string): Record<string, string> => {
  const token = String(serviceToken ?? readActiveServiceToken()).trim();
  return token
    ? {
        "x-service-token": token,
      }
    : {};
};

export const compressImages = async (
  baseUrl: string,
  files: File[],
  mode: string,
  advancedOptions: ImageAdvancedOptions | null = null,
  options: ServiceRequestOptions = {}
): Promise<BinaryServiceResult> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("mode", mode);

  if (mode === "advanced" && advancedOptions) {
    formData.append("advancedOptions", JSON.stringify(advancedOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/compress")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, "compressed-images.zip"),
    message: readOperationMessage(response.headers, "Images compressed successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const convertImages = async (
  baseUrl: string,
  files: File[],
  targetFormat: string,
  conversionOptions: ImageAdvancedOptions | null = null,
  options: ServiceRequestOptions = {}
): Promise<BinaryServiceResult> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("targetFormat", targetFormat);

  if (conversionOptions) {
    formData.append("conversionOptions", JSON.stringify(conversionOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/convert")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  return {
    blob: response.blob,
    fileName: unwrapFileName(response.headers, `converted-images-${targetFormat}.zip`),
    message: readOperationMessage(response.headers, "Images converted successfully"),
    requestId: readRequestId(response.headers),
  };
};

export const convertImagePreview = async (
  baseUrl: string,
  file: File,
  targetFormat: string,
  conversionOptions: ImageAdvancedOptions | null = null,
  options: ServiceRequestOptions = {}
): Promise<BinaryServiceResult> => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("targetFormat", targetFormat);

  if (conversionOptions) {
    formData.append("conversionOptions", JSON.stringify(conversionOptions));
  }

  const taskIdSuffix = options.taskId ? `?taskId=${encodeURIComponent(options.taskId)}` : "";

  const response = await uploadMultipartBinary({
    url: `${buildUrl(baseUrl, "/api/image/convert-preview")}${taskIdSuffix}`,
    formData,
    onUploadProgress: options.onUploadProgress,
    headers: buildServiceHeaders(options.serviceToken),
  });
  emitAccessUsageUpdated();

  const extensionByFormat: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    avif: "avif",
    tiff: "tiff",
    gif: "gif",
  };

  return {
    blob: response.blob,
    fileName: unwrapFileName(
      response.headers,
      `converted-preview.${extensionByFormat[targetFormat] || "bin"}`
    ),
    message: readOperationMessage(response.headers, "Image preview generated successfully"),
    requestId: readRequestId(response.headers),
  };
};
