import httpStatus from 'http-status';
import type {BodyMessage, HttpErrorBody, HttpStatusNumber} from './types';

/**
 * Get a human-readable error name from the HTTP status code.
 * @param {number} status - The HTTP status code.
 * @returns {string} - The formatted error name.
 */
export const getErrorName = (status: number): string => {
  if (status < 400 || status > 511) return 'HttpError';
  const name = httpStatus[`${status as HttpStatusNumber}_NAME`]
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, '');
  return name.endsWith('Error') ? name : name.concat('Error');
};

/**
 * Base class for handling HTTP errors.
 * @extends {Error}
 */
export class HttpError extends Error {
  /**
   * @param {BodyMessage} msg - The error message.
   * @param {number} status - The HTTP status code. default is 500 (Internal Server Error).
   * @param {any} [detail] - Optional detailed error information.
   */
  constructor(
    readonly msg: BodyMessage,
    readonly status: number = httpStatus.INTERNAL_SERVER_ERROR,
    readonly detail?: object,
  ) {
    super();
    this.name = getErrorName(status);
    this.message = typeof msg === 'string' ? msg : this.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert the HttpError instance to a JSON object.
   * @returns {HttpErrorBody} - The JSON representation of the error.
   */
  public toJson(): HttpErrorBody {
    const obj: HttpErrorBody = {
      status: this.status,
      error: this.name,
      message: this.msg,
    };
    if (this.detail) obj['detail'] = this.detail;
    return obj;
  }
}

/**
 * Represents a Bad Request HTTP error (400).
 * @extends {HttpError}
 */
export class BadRequestError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.BAD_REQUEST, detail);
  }
}

/**
 * Represents a Conflict HTTP error (409).
 * @extends {HttpError}
 */
export class ConflictError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.CONFLICT, detail);
  }
}

/**
 * Represents a Forbidden HTTP error (403).
 * @extends {HttpError}
 */
export class ForbiddenError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.FORBIDDEN, detail);
  }
}

/**
 * Represents a Not Found HTTP error (404).
 * @extends {HttpError}
 */
export class NotFoundError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.NOT_FOUND, detail);
  }
}

/**
 * Represents an Unauthorized HTTP error (401).
 * @extends {HttpError}
 */
export class UnauthorizedError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.UNAUTHORIZED, detail);
  }
}

/**
 * Represents an Internal Server Error HTTP error (500).
 * @extends {HttpError}
 */
export class InternalServerError extends HttpError {
  constructor(message: BodyMessage, detail?: object) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR, detail);
  }
}
