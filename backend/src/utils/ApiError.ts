export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication required", details?: unknown) {
    return new ApiError(401, "UNAUTHORIZED", message, details);
  }

  static forbidden(message = "You do not have permission to access this resource", details?: unknown) {
    return new ApiError(403, "FORBIDDEN", message, details);
  }

  static notFound(message = "Resource not found", details?: unknown) {
    return new ApiError(404, "NOT_FOUND", message, details);
  }

  static internal(message = "Internal server error", details?: unknown) {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
  }
}
