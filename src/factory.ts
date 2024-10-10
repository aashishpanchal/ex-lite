import {ApiRes} from './api-res';
import type {Response} from 'express';
import type {Constructor, ReqHandler} from './types';

/** Sends the appropriate response based on the result of the function. */
const handleResult = (result: unknown, res: Response): void => {
  // If the result is an ApiRes instance, sends the status and JSON response.
  if (result instanceof ApiRes) res.status(result.status).json(result.toJson());
  // Otherwise, sends the result directly.
  else if (result && result !== res) res.send(result);
};

/**
 * Wrapper for route handlers to support both synchronous and asynchronous functions.
 * It catches errors and forwards them to Express' error handler.
 */
export const wrapper =
  (func: ReqHandler): ReqHandler =>
  (req, res, next) => {
    try {
      const result = func(req, res, next);
      // Handle async (Promise) or sync results.
      if (result instanceof Promise)
        result.then((value: any) => handleResult(value, res)).catch(next);
      else handleResult(result, res);
    } catch (error) {
      next(error);
    }
  };

/**
 * Resolves an instance of a class using tsyringe for dependency injection.
 * If tsyringe is not installed, it throws an error and terminates the process.
 */
const resolveInstance = <T>(cls: Constructor<T>) => {
  let tsyringe: any = null;
  try {
    tsyringe = require('tsyringe');
  } catch (error) {
    console.log(
      'tsyringe is not installed. please install it, using package manager.',
    );
    console.log(error);
    process.exit(1);
  }
  // Resolve the class instance from the tsyringe container
  return tsyringe.container.resolve(cls);
};

/** Creates a wrapped controller method for Express routes. */
export const createController = <T>(cls: Constructor<T>) => {
  const instance = resolveInstance(cls);

  // Get and wrap the controller method as an Express handler
  return <K extends keyof T>(key: K): ReqHandler => {
    const handler = instance[key]; // It retrieves the controller's method,
    // Ensure the handler is a function
    if (typeof handler !== 'function')
      throw new Error(
        `Handler ${key as string} is not a function of ${cls.name}`,
      );
    return wrapper(handler.bind(instance));
  };
};

/** Base controller class that provides a static method to wrap and resolve controller methods. */
export abstract class Controller {
  /**
   * Returns a wrapped controller method as an Express route handler.
   * The method is resolved from the class using tsyringe.
   */
  static handler<T, K extends keyof T>(this: Constructor<T>, key: K) {
    const instance = resolveInstance(this);
    const handler = instance[key]; // It retrieves the controller's method,
    // Ensure the handler is a function
    if (typeof handler !== 'function')
      throw new Error(
        `Handler ${key as string} is not a function of ${this.name}`,
      );
    return wrapper(handler.bind(instance));
  }
}
