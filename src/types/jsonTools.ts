/*
  JSON workspace modules exchange the same tool metadata, option schema, and
  normalized error payloads, so these shared types prevent drift across the
  view, workspace component, and runner composable while the engine remains on
  a separate migration track.
*/
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export type JsonToolCategory =
  | "Format"
  | "Convert"
  | "Analyze"
  | "Compare"
  | "Structure"
  | "Protect"
  | "Visual";

export type JsonToolSecondaryInputMode = "text";
export type JsonToolOutputKind = "text" | "visual";

export interface JsonToolOptionChoice {
  label: string;
  value: string;
}

export interface JsonToolOptionField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  options?: JsonToolOptionChoice[];
}

export interface JsonToolDefinition {
  id: string;
  title: string;
  description: string;
  category: JsonToolCategory;
  optionsSchema: JsonToolOptionField[];
  inputLabel?: string;
  secondaryInputLabel?: string;
  secondaryInputMode?: JsonToolSecondaryInputMode;
  outputKind?: JsonToolOutputKind;
  fileExtension?: string;
}

export interface LocalizedJsonToolDefinition extends Omit<JsonToolDefinition, "category"> {
  category: string;
}

export interface JsonToolError {
  code: string;
  message: string;
  details: Array<{ field?: string; issue?: string }>;
}

export type JsonToolOptions = Record<string, string | number | boolean>;

export interface JsonToolRunRequest {
  toolId: string;
  input: string;
  secondaryInput?: string;
  options?: JsonToolOptions;
}

export interface JsonToolExecutionContext {
  input: string;
  secondaryInput: string;
  options: JsonToolOptions;
}

export interface JsonToolSuccessResult {
  ok: true;
  outputText: string;
  extension: string;
  mimeType: string;
}

export interface JsonToolFailureResult {
  ok: false;
  error: JsonToolError;
}

export type JsonToolRunResult = JsonToolSuccessResult | JsonToolFailureResult;

export type JsonToolHandler = (context: JsonToolExecutionContext) => string | JsonValue;

export interface JsonVisualOptions {
  theme?: "light" | "dark";
  fontSize?: number | string;
  title?: string;
}

export interface JsonVisualRequest {
  toolId: string;
  input: string;
  options?: JsonVisualOptions;
}

export interface JsonVisualResult {
  outputUrl: string;
  outputBlob: Blob;
  outputText: string;
  mimeType: string;
  extension: string;
}
