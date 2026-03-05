/*
  Local operational error type keeps JSON tool failures predictable for UI rendering
  and prevents leaking raw runtime exceptions to users.
*/
export class ApiError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}
