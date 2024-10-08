import {ApiRes} from './api-res';
import type {Response} from 'express';
import type {Constructor, ReqHandler} from './types';

// Handles the result returned by the wrapped function.
function handleResult(result: unknown, res: Response): void {
  if (result instanceof ApiRes) res.status(result.status).json(result);
  else if (result && result !== res) res.send(result);
}

// Implementation of the wrapper function.
export const wrapper =
  (func: ReqHandler): ReqHandler =>
  (req, res, next) => {
    try {
      // Execute the function
      const result = func(req, res, next);
      // Handle promises or regular values returned by the function.
      if (result instanceof Promise)
        result.then((value: any) => handleResult(value, res)).catch(next);
      else handleResult(result, res);
    } catch (error) {
      next(error);
    }
  };

// Factory function to create controller handlers.
export const controllerFactory = <T>(cls: Constructor<T>) => {
  let tsyringe: any = null;

  try {
    tsyringe = require('tsyringe');
  } catch (error) {
    console.log(
      'tsyringe is not installed. Please install it to use the controller factory.',
    );
    console.log(error);
    process.exit(1);
  }

  const instance: InstanceType<typeof cls> = tsyringe.container.resolve(cls);

  // Get a controller method as a handler.
  const getMethod = <K extends keyof T>(key: K): ReqHandler => {
    const handler = instance[key];
    if (typeof handler !== 'function')
      throw new Error(`Handler ${key as string} is not a function`);
    return wrapper(handler.bind(instance));
  };

  return {getMethod};
};
