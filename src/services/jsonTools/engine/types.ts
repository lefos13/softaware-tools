/*
  Local operational error type keeps JSON tool failures predictable for UI rendering
  and prevents leaking raw runtime exceptions to users.
*/
import type { JsonToolError } from "../../../types/jsonTools";

export class ApiError extends Error {
  code: string;
  details: JsonToolError["details"];

  constructor(code: string, message: string, details: JsonToolError["details"] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}
