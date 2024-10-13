# Ex-Lite

`ex-lite` is a lightweight utility for Express.js that simplifies common server-side tasks. It streamlines error handling, status code management, response formatting, input validation, and more. It also integrates well with tools like Zod and Tsyringe to enhance the development of Express.js applications.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Middlewares](#middlewares)
  - [1. Error Handling Middleware (`errorHandler`)](#1-error-handling-middleware-errorhandler)
  - [2. Not Found Handler (`notFoundHandler`)](#2-not-found-handler-notfoundhandler)
- [Wrapper: Simplifying Controllers](#wrapper-simplifying-controllers)
- [HttpError](#httperror)
- [Using `HttpStatus` for Consistent Status Codes](#using-httpstatus-for-consistent-status-codes)
- [Standardized JSON Responses with `ApiRes`](#standardized-json-responses-with-apires)
- [Validation with `Zod`](#validation-with-zod)
- [Controller Class](#controller-class)
- [Contributing](#contributing)
- [License](#license)

## Features

- **`wrapper`**: controller functions by automatically managing errors.
- **`HttpError & HttpStaus`**: Handles custom http-errors. & Provides http-status codes.
- **`ApiRes`**: JSON API responses object with pre-defined methods (e.g., `ok`, `created` `paginated`).
- **`validate`**: Middleware for validating request `body`, `query`, and `params` using Zod schemas.
- **`createController`**: Creates a wrapped controller method for routes**.** with dependency injection using `tsyringe` and without.
- `middlewares`:
  - **`errorHandler`**: Centralized error-handling middleware for catching and processing errors across the application.
  - **`notFoundHandler`**: Middleware that returns a standardized 404 response for undefined routes.

## Installation

Install `ex-lite`

```bash
npm install --save ex-lite zod
```

## Quick Start

Here’s a minimal setup to get you started with `ex-lite`:

```tsx
import express from 'express';
import {wrapper, errorHandler, notFoundHandler} from 'ex-lite';

const app = express();

// Middleware
app.use(express.json());

// Example route using wrapper
const getUser = wrapper(async (req, res) => {
  const user = await getUserById(req.params.id);
  return ApiRes.ok(user); // Send user data in the response
});

app.get('/user/:id', getUser);
app.use(notFoundHandler());

// Error handling middleware
app.use(errorHandler());

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Middlewares

### **1. Error Handling Middleware (`errorHandler`)**

The `errorHandler` middleware ensures that all errors thrown in the application, whether intentional (like `HttpError`) or unexpected, are handled consistently. This prevents unhandled errors from crashing your server.

```tsx
import {errorHandler} from 'ex-lite';

app.use(errorHandler()); // Place this after route definitions
```

This middleware catches any error in the app and formats a standardized response. It works in tandem with the `HttpError` class to return appropriate status codes and error messages.

### **2. Not Found Handler (`notFoundHandler`)**

The `notFoundHandler` middleware provides a default response for undefined routes. It ensures that your application returns a clean, standardized 404 response without requiring additional boilerplate code.

```tsx
import {notFoundHandler} from 'ex-lite';

app.use(notFoundHandler()); // This should be placed after your routes
```

## Wrapper: Simplifying Controllers

In an Express.js application, dealing with asynchronous functions often requires `try-catch` blocks to handle errors. This can lead to repetitive, boilerplate code in every route handler. The `wrapper` function in `ex-lite` eliminates this by automatically managing `try-catch` behavior for async/sync functions, ensuring that any thrown errors are caught and handled by your error-handling middleware.

### Why Use `wrapper`?

Without `wrapper`, your route handlers would typically look like this:

```tsx
// Route without wrapper (traditional approach with try-catch)
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});
```

This can get cumbersome when you have many routes. The `wrapper` function simplifies this pattern by catching any errors and passing them to `next()` automatically.

### How to Use `wrapper`

The `wrapper` function accepts an async/sync function (a route handler) and returns a new function that will handle errors for you. Here’s how to use it:

```tsx
import {wrapper, ApiRes} from 'ex-lite';

// Route using wrapper (simplified with ex-lite)
app.get(
  '/user/:id',
  wrapper(async (req, res) => {
    const user = await getUserById(req.params.id); // Fetch user from database
    return ApiRes.ok(user, 'User fetched successfully'); // Send success response using ApiRes
  }),
);
```

**Example of manipulating cookies and header, etc with `ApiRes`**

```tsx
const login = wrapper(async (req, res) => {
  const {email, password} = req.body;
  const user = await loginUser(email, password);

  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');

  // Set multiple cookies for authentication
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });

  res.cookie('refresh-token', user.refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 3600000, // 1 week
  });

  // api-response with token and user info
  return ApiRes.ok(user, 'Logged in successfully');
});
```

**Example without `ApiRes`**

```tsx
// 1. example
const getHome = wrapper(() => {
  return 'Hello World!';
});

// 2. example
const getHome = wrapper(() => {
  return {
    message: 'Hello World!',
  }; // default set status-code 200
});

// 3. example
const login = wrapper(async (req, res) => {
  const user = await getUserById(req.params.id);

  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');

  // Setting cookies
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });

  // Sending a custom JSON response
  res.status(200).json({
    status: 'success',
    message: 'User fetched successfully',
    data: user,
  });
});
```

**Example as `middleware`**

```tsx
import {Role} from './constants';
import {wrapper, ForbiddenError} from 'ex-lite';

/** user permission middleware */
export const permission = (...roles: Role[]) =>
  wrapper(async (req, _, next) => {
    const {user} = req;

    if (!roles) return true;

    if (!user) return false;

    const checker = user && roles.includes(user?.role);

    if (!checker)
      throw new ForbiddenError(
        `User have not permission to access ${req.originalUrl}`,
      );

    next();
  });

// all permission middleware
export const onlyAdmin = permission(Role.ADMIN);
export const adminOrUser = permission(Role.ADMIN, Role.USER);
```

**How `wrapper` Works**

1. **Input**: You pass an async function (the route handler) to `wrapper`.
2. **Behavior**: The `wrapper` function executes your handler inside a `try-catch` block.
3. **Error Handling**: If your handler throws an error (e.g., from a database query), `wrapper` catches it and passes the error to Express's `next()` function.
4. **Success**: If no errors occur, the handler returns a response using helper methods like `ApiRes.ok`.

**What Happens Behind the Scenes:**

- Instead of writing `try-catch` for every async controller, `wrapper` automatically catches any errors and forwards them to the next middleware (`next(error)`).
- This helps to **reduce boilerplate code** and keeps your controllers clean and focused on their logic.

**Benefits of Using `wrapper`:**

- **Error Management**: Errors are passed to the `errorHandler` middleware automatically.
- **Less Boilerplate**: No need to manually write `try-catch` blocks in every route.
- **Consistency**: It ensures that all errors are handled in a centralized manner.

## HttpError

The `HttpError` class standardizes error handling by extending the native `Error` class. It’s used to throw HTTP-related errors, which are then caught by the `errorHandler` middleware for consistent processing.

### Usage

```tsx
import {HttpError, HttpStatus} from 'ex-lite';

// Example without wrapper
app.get('*', () => {
  throw new HttpError('Not Found', HttpStatus.NOT_FOUND); // Throw a 404 error
});

// Example with wrapper
app.post(
  '/example',
  wrapper(req => {
    if (!req.body.name) throw new BadRequestError('Name is required');
  }),
);
```

**HttpError(msg, status, details)**

- `msg` - this parameter accepts an error message, which can be a single string or an array of strings.**,** `required`
- `status` - the status code of the error, mirroring `statusCode` for general compatibility, default is `500`
- `detail` - this is an `optional` plain object that contains additional information about the error.

```tsx
const err = new HttpError('Validation error.', 400, {
  username: 'Username is required',
  password: 'Password is required',
});
```

**Provide build common http-errors.**

- `BadRequestError`
- `UnauthorizedError`
- `NotFoundError`
- `ConflictError`
- `ForbiddenError`
- `InternalServerError`

**_Note:_**

- _if you use build http-errors class, you won't need to include the status code as a property, since each child class can define its own status code._
- _If only provides a status code, the `HttpError` class will automatically generate an appropriate error name based on that status code._

## Using `HttpStatus` for Consistent Status Codes

The `HttpStatus` enumeration provides a consistent way to manage HTTP status codes.

```tsx
import {HttpStatus} from 'ex-lite';

app.get('/status-example', (req, res) => {
  res.status(HttpStatus.OK).json({message: 'All good!'});
});
```

## Standardized JSON Responses with `ApiRes`

`ApiRes` provides a consistent structure for API responses. It includes several static methods that handle common response patterns, such as `ok`, `created` `paginated`.

### Usage

```tsx
import {ApiRes} from 'ex-lite';

app.post(
  '/create-user',
  wrapper(req => {
    const user = createUser(req.body); // Create new user
    return ApiRes.created(user, 'User created successfully');
  }),
);
```

**ApiRes Methods**

- **`ok(result, message)`**: Returns a success response (HTTP 200).
- **`created(result, message)`**: Returns a resource creation response (HTTP 201).
- `paginated(data, meta, message)`**:** Returns a success response (HTTP 200).

## Validation with `Zod`

The `validate` middleware integrates Zod schemas for request validation. It supports validation for request `body`, `params`, and `query`.

### Usage

```tsx
import {validate} from 'ex-lite';
import {z} from 'zod';

// Define schema for body
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive'),
});

// Define schema for params
const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Define schema for query
const querySchema = z.object({
  search: z.string().optional(),
});

// Route with body validation
app.post('/user', validate.body(userSchema), (req, res) => {
  res.json(ApiRes.ok(req.body)); // Respond with validated body
});

// Route with params validation
app.get('/user/:id', validate.params(userIdSchema), (req, res) => {
  const userId = req.params.id;
  res.json(ApiRes.ok({userId})); // Respond with validated params
});

// Route with query validation
app.get('/search', validate.query(querySchema), (req, res) => {
  const searchTerm = req.query.search || 'No search term provided';
  res.json(ApiRes.ok({searchTerm})); // Respond with validated query
});
```

## Controller Class

Creating class-based controllers in Express.js can be complex due to the need for managing instance methods, binding **`this`** context, and handling dependencies. Traditional middleware functions typically rely on plain functions, making it challenging to encapsulate logic and state effectively in a class-based structure.

The **`createController`** function simplifies this process by providing an easy way to create class-based controllers and automatically handling method references internally. This allows developers to focus on their application logic rather than the boilerplate code required for class-based controllers.

`createController(cls, useTsyringe)`

- `cls` A class constructor function representing the controller.
- `useTsyringe` (optional): A boolean indicating whether to use `tsyringe` for dependency injection. Defaults to `true`.

### Example without `tsyringe`

Use `createController(Controller, false)` to create a controller with a local instance.

```tsx
// create a controller with a local instance.
const controller = createController(Controller, false);
```

### Usage

```tsx
// auth.service.ts
export class AuthService {
  async signin(data: object) {
    ''''
  }

  async signup(data: object) {
    ''''
  }
}

// auth.controller.ts
import {ApiRes} from 'ex-lite';
import {AuthService} from './auth.service'; // Importing service without tsyringe
import type {Request, Response} from 'express';

export class AuthController {
  private authService = new AuthService(); // Local instance

  async signin(req: Request, res: Response) {
    const user = await this.authService.signin(req.body);
    return ApiRes.ok(user, 'User signed in successfully');
  }

  async signup(req: Request, res: Response) {
    const user = await this.authService.signup(req.body);
    return ApiRes.created(user, 'User signed up successfully');
  }
}

// auth.routes.ts
import {Router} from 'express';
import {createController} from 'ex-lite';
import {AuthController} from './auth.controller';

export const authRoutes = (): Router => {
  // Router
  const router = Router();
  // Controller
  const auth = createController(AuthController, false); // Without using tsyringe
  // Initialize
  return router
    .post('/signin', auth.getMethod('signin'))
    .post('/signup', auth.getMethod('signup'))
};

// app.ts
app.use('/user', authRoutes())
```

### Example with `tsyringe`

Use `createController(AuthController, true)` to create a controller that leverages dependency injection.

```tsx
// create a controller with leverage the tsyringe dependency injection system.
const controller = createController(Controller); // Using tsyringe
```

you need to configure your project as follows:

1. Install `tsyringe`:

   ```bash
   npm install tsyringe reflect-metadata
   ```

2. Configure TypeScript:
   Add the following to your `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     }
   }
   ```
3. Import `reflect-metadata` in your main file (e.g., `app.ts` or `server.ts`):

   ```tsx
   import 'reflect-metadata';
   ```

### Usage

In this example, `AuthController` uses the `AuthService` for authentication handling. The `createController` handlers making method injection easy.

```tsx
// auth.service.ts
import {singleton} from 'tsyringe';

@singleton()
export class AuthService {
  async signin(data: object) {
    ''''
  }

  async signup(data: object) {
    ''''
  }
}

// auth.controller.ts
import {singleton} from 'tsyringe';
import {AuthService} from './auth.service.ts';
import type {Request, Response} from 'express'

@singleton()
export class AuthController {
  constructor(private authService: AuthService) {}

  /** signin request handler */
  async signin(req: Request, res: Response) {
    const {access, refresh, user} = await this.authService.signin(req.body);
    res.cookie('access-token', access.token, {
      httpOnly: true,
      maxAge: access.maxAge,
    });
    res.cookie('refresh-token', refresh.token, {
      httpOnly: true,
      maxAge: refresh.maxAge,
    });
    return ApiRes.ok(user.id, 'User logged in successfully');
  }

  /** signup request handler */
  async signup(req: Request, res: Response) {
    const user = await this.authService.signup(req.body);
    return ApiRes.created(user.id, 'User created successfully');
  }
}

// auth.routes.ts
import {Router} from 'express'
import {createController} from 'ex-lite';
import {AuthController} from './auth.controller.ts'

export const authRoutes = (): Router => {
  // Router
  const router = Router();
  // Controller
  const auth = createController(AuthController);
  // Initialize
  return router
    .post('/signin', auth.getMethod('signin'))
    .post('/signup', auth.getMethod('signup'))
};

// app.ts
app.use('/user', authRoutes())
```

**_Note:_** _The `createController` is an feature that allows you to use `tsyringe` for dependency injection in your controllers. This is especially useful for larger applications where different services need to be injected into controllers._

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

`ex-lite` is licensed under the MIT License. See the `LICENSE` file for more information.

---

**Disclaimer:** This library is currently under development. While contributions are appreciated, there is no need to start begging for features or fixes.
