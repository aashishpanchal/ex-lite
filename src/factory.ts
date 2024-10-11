import {ApiRes} from './api-res';
import type {Response} from 'express';
import type {Constructor, ReqHandler} from './types';

/**
 * Sends the appropriate response based on the result of the function.
 *
 * @param {unknown} result - The result of the handler function, can be an instance of ApiRes or other value.
 * @param {Response} res - Express response object.
 */
const handleResult = (result: unknown, res: Response): void => {
  // If the result is an ApiRes instance, sends the status and JSON response.
  if (result instanceof ApiRes) res.status(result.status).json(result.toJson());
  // Otherwise, sends the result directly.
  else if (result && result !== res) res.send(result);
};

/**
 * Wrapper for route handlers to support both synchronous and asynchronous functions.
 * It catches errors and forwards them to Express' error handler.
 *
 * @param {ReqHandler} func - The route handler function, can be sync or async.
 * @returns {ReqHandler} - Wrapped handler function that supports async errors and proper result handling.
 *
 * @example
 * // Example of wrapping a route handler
 * app.get('/example', wrapper(async (req, res) => {
 *   const result = await someAsyncFunction();
 *   res.json(result);
 * }));
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
 *
 * @param {Constructor<T>} cls - The class constructor to resolve an instance of.
 * @returns {T} - An instance of the given class resolved by tsyringe's container.
 *
 * @throws If tsyringe is not installed, the process will exit with an error message.
 *
 * @example
 * const instance = resolveInstance(AuthService);
 */
const resolveInstance = <T>(cls: Constructor<T>): T => {
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

/**
 * Validates and retrieves a controller method.
 *
 * @param {T} instance - The controller instance.
 * @param {keyof T} key - The method key (name) to retrieve from the controller instance.
 * @returns {ReqHandler} - The wrapped request handler function for the method.
 *
 * @throws If the provided key is not a function, it throws an error.
 *
 * @example
 * const handler = getControllerMethod(authController, 'login');
 * app.post('/login', handler); // Binds and wraps the login method from the authController
 */
export const getControllerMethod = <T>(
  instance: T,
  key: keyof T,
): ReqHandler => {
  const handler = instance[key]; // It retrieves the controller's method,
  // Ensure the handler is a function
  if (typeof handler !== 'function')
    throw new Error(
      `Handler ${key as string} is not a function of ${instance.constructor.name}`,
    );
  return wrapper(handler.bind(instance));
};

/**
 * Creates a wrapped controller method for Express routes.
 * - If `useTsyringe` is true or omitted, it resolves the controller class using tsyringe's container.
 * - If `useTsyringe` is false, it creates a local instance of the controller class without using tsyringe.
 *
 * @param {Constructor<T>} cls - The controller class to create an instance of.
 * @param {boolean} [useTsyringe=true] - Optional flag to use tsyringe for dependency injection (default: true).
 *
 * @example
 * // Using tsyringe for dependency injection:
 * const auth = createController(AuthController);
 * app.get('/login', auth.getMethod('login')); // Assuming 'login' is a method in AuthController
 *
 * // Creating a local instance without tsyringe:
 * const blog = createController(BlogController, false);
 * app.get('/posts', blog.getMethod('getPosts')); // Assuming 'getPosts' is a method in BlogController
 */
export const createController = <T>(
  cls: Constructor<T>,
  useTsyringe: boolean = true,
) => {
  const instance = useTsyringe ? resolveInstance(cls) : new cls();
  // return object
  return {
    /**
     * Retrieves and wraps a controller method for Express routes.
     *
     * @param {keyof T} key - The method key (name) to retrieve from the controller instance.
     * @returns {ReqHandler} - The wrapped request handler function for the method.
     */
    getMethod: <K extends keyof T>(key: K): ReqHandler =>
      getControllerMethod(instance, key),
  };
};
