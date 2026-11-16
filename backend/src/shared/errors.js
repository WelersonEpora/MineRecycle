"use strict";

// Erros de domínio. O `code` é estável: o frontend traduz por ele (inglês e português).
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const make = (status, defaultCode, defaultMessage) =>
  class extends AppError {
    constructor(message = defaultMessage, details = null, code = defaultCode) {
      super(message, status, code, details);
    }
  };

const ValidationError = make(400, "VALIDATION_ERROR", "Invalid data.");
const UnauthorizedError = make(401, "UNAUTHORIZED", "Not authenticated.");
const ForbiddenError = make(403, "FORBIDDEN", "Access denied.");
const NotFoundError = make(404, "NOT_FOUND", "Not found.");
const ConflictError = make(409, "CONFLICT", "Conflict.");
const GoneError = make(410, "GONE", "No longer available.");
const PayloadTooLargeError = make(413, "PAYLOAD_TOO_LARGE", "File too large.");
const TooManyRequestsError = make(429, "TOO_MANY_REQUESTS", "Too many requests. Try again later.");

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  GoneError,
  PayloadTooLargeError,
  TooManyRequestsError
};
