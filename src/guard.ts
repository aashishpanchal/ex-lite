import type {Schema} from 'zod';
import type {ReqHandler} from './types';
import {ErrorRequestHandler, Router} from 'express';
import {
  HttpError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from './errors';

/** function to validate the request object based on the provided schema and type. */
const validateFn =
  (schema: Schema, type: 'body' | 'query' | 'params'): ReqHandler =>
  async (req, res, next) => {
    const {success, data, error} = schema.readonly().safeParse(req[type]);
    // if success then data set in req[type]
    if (success) {
      req[type] = data;
      next(); // proceed to the next middleware/handler
    } else {
      // if error then create error instance and return it
      const err = new BadRequestError(
        `req.${type} fields validation error`,
        error.errors,
      );
      return res.status(err.status).json(err.toJson());
    }
  };

export const validate = {
  /** validate the request body. */
  body: (schema: Schema) => validateFn(schema, 'body'),
  /** validate the request query parameters. */
  query: (schema: Schema) => validateFn(schema, 'query'),
  /** validate the request route parameters. */
  params: (schema: Schema) => validateFn(schema, 'params'),
};

// global error handler
export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  // http-error handler
  if (err instanceof HttpError)
    return res.status(err.status).json(err.toJson());
  // unknown-error handler
  const error = new InternalServerError(err.message);
  return res.status(error.status).json(error.toJson());
};

// not-found handler
export const notFoundHandler: Router = Router().all('*', (req, res) => {
  const err = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`, {
    url: req.originalUrl,
    method: req.method,
  });
  res.status(err.status).json(err.toJson());
});
