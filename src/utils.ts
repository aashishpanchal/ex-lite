import type {Schema} from 'zod';
import type {ReqHandler} from './types';
import {ErrorRequestHandler, Router} from 'express';
import {
  HttpError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from './errors';

/**
 * Creates a middleware function to validate the request object based on the provided schema and type.
 *
 * @param {Schema} schema - The validation schema to be used.
 * @param {('body' | 'query' | 'params')} type - The part of the request to validate ('body', 'query', or 'params').
 * @returns {ReqHandler} A middleware function that validates the request.
 *
 * @description
 * This function returns a middleware that:
 * 1. Validates the specified part of the request (body, query, or params) against the provided schema.
 * 2. If validation succeeds, it updates the request object with the parsed data and calls the next middleware.
 * 3. If validation fails, it sends a BadRequestError response with details about the validation errors.
 *
 * @example
 * const validateBody = validateFn(userSchema, 'body');
 * router.post('/users', validateBody, createUser);
 */
const validateFn =
  (schema: Schema, type: 'body' | 'query' | 'params'): ReqHandler =>
  async (req, res, next) => {
    const {success, data, error} = schema.readonly().safeParse(req[type]);
    // If success then data set in req[type]
    if (success) {
      req[type] = data;
      next(); // Proceed to the next middleware/handler
    } else {
      // If error then create error instance and return it
      const err = new BadRequestError(
        `validation error occur from req.${type} fields`,
        error.errors,
      );
      return res.status(err.status).json(err.toJson());
    }
  };

/**
 * Object containing methods to create validation middleware for different parts of the request.
 * - Each method returns a middleware function that validates the corresponding part of the request.
 *
 * @example
 * router.get('/user/:id', validate.params(userId), getUser);
 * router.get('/users', validate.body(paginated), getUsers);
 * router.post('/user', validate.body(userBody), createUser);
 */
export const validate = {
  /**
   * Creates a middleware to validate the request body.
   * @param {Schema} schema - The validation schema for the request body.
   * @returns {ReqHandler} Middleware function to validate the request body.
   */
  body: (schema: Schema): ReqHandler => validateFn(schema, 'body'),

  /**
   * Creates a middleware to validate the request query parameters.
   * @param {Schema} schema - The validation schema for the query parameters.
   * @returns {ReqHandler} Middleware function to validate the request query parameters.
   */
  query: (schema: Schema): ReqHandler => validateFn(schema, 'query'),

  /**
   * Creates a middleware to validate the request route parameters.
   * @param {Schema} schema - The validation schema for the route parameters.
   * @returns {ReqHandler} Middleware function to validate the request route parameters.
   */
  params: (schema: Schema): ReqHandler => validateFn(schema, 'params'),
};

/**
 * Global error handler middleware.
 * Handles HttpErrors and unknown errors, returning appropriate JSON responses.
 * @param {boolean} isDev - Indicates if the application is in development mode.
 * @returns {ErrorRequestHandler} Express error handling middleware function.
 */
export const errorHandler =
  (isDev: boolean = true): ErrorRequestHandler =>
  (err, req, res, next): any => {
    // http-error handler
    if (err instanceof HttpError)
      return res.status(err.status).json(err.toJson());
    // unknown-error handler
    isDev && console.error(err);
    const error = new InternalServerError(
      err.message,
      isDev ? err.stack : null,
    );
    return res.status(error.status).json(error.toJson());
  };

/**
 * Creates a router to handle 404 Not Found errors.
 * @returns {Router} Express router that catches all unmatched routes and returns a NotFoundError.
 */
export const notFoundHandler = (): Router =>
  Router().all('*', (req, res) => {
    const err = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`, {
      url: req.originalUrl,
      method: req.method,
    });
    res.status(err.status).json(err.toJson());
  });
