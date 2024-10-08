# Ex-Lite

`ex-lite` is a lightweight utility for Express.js that simplifies common server-side tasks. It streamlines error handling, status code management, response formatting, input validation, and more. It also integrates well with tools like Zod and Tsyringe to enhance the development of Express.js applications.

---

## Features

- **`wrapper`**: Simplifies async controller functions by automatically managing errors.
- **`HttpStatus`**: Provides an enumeration of HTTP status codes.
- **`HttpError`**: Handles custom HTTP errors.
- **`ApiRes`**: Standardizes JSON API responses with pre-defined methods (e.g., `ok`, `created`).
- **`validate`**: Middleware for validating request `body`, `query`, and `params` using Zod schemas.
- **`controllerFactory`**: A factory function for creating controller handlers with dependency injection using `tsyringe`.
- **`errorHandler`**: Centralized error-handling middleware for catching and processing errors across the application.
- **`notFoundHandler`**: Middleware that returns a standardized 404 response for undefined routes.

## Installation

Install `ex-lite`

```bash
npm install --save ex-lite zod
```

## Middleware

Middleware in `ex-lite` simplifies error handling and route management.

### **1. Error Handling Middleware (`errorHandler`)**

The `errorHandler` middleware ensures that all errors thrown in the application, whether intentional (like `HttpError`) or unexpected, are handled consistently. This prevents unhandled errors from crashing your server.

```tsx
import express from 'express';
import {errorHandler, HttpError, HttpStatus} from 'ex-lite';

const app = express();

// Throwing a 404 error if no route matches
app.get('*', () => {
  throw new HttpError('Resource Not Found', HttpStatus.NOT_FOUND);
});

// Central error-handling middleware
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

This middleware catches any error in the app and formats a standardized response. It works in tandem with the `HttpError` class to return appropriate status codes and error messages.

### **2. Not Found Handler (`notFoundHandler`)**

The `notFoundHandler` middleware provides a default response for undefined routes. It ensures that your application returns a clean, standardized 404 response without requiring additional boilerplate code.

```tsx
import express from 'express';
import {notFoundHandler, errorHandler} from 'ex-lite';

const app = express();

// Define your API routes here
app.use('/api', apiRoutes);

// Handle 404 for any undefined route
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Wrapper

The `wrapper` function simplifies async route handling by wrapping controller functions and automatically catching errors. This saves you from having to repeatedly write `try-catch` blocks.

### Usage

```tsx
import {wrapper, ApiRes} from 'ex-lite';

const getUser = wrapper(async (req, res) => {
  const user = await getUserById(req.params.id); // Fetch the user by ID
  return ApiRes.ok(user); // Return success response
});

app.get('/user/:id', getUser);
```

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
  wrapper((req, res, next) => {
    if (!req.body.name) throw new BadRequestError('Name is required');
  }),
);

// Example with an unknown error
app.get(
  '/unknown-error',
  wrapper((req, res, next) => {
    throw new Error('Hello World');
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

`ApiRes` provides a consistent structure for API responses. It includes several static methods that handle common response patterns, such as `ok`, `created`.

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

## Controller Factory with `tsyringe`

you need to configure your project as follows:

1.  Install `tsyringe`:

    ```bash
    npm install tsyringe reflect-metadata
    ```

2.  Configure TypeScript:
    Add the following to your `tsconfig.json`:
        ```json
        {
          "compilerOptions": {
            "experimentalDecorators": true,
            "emitDecoratorMetadata": true
          }
        }
        ```
3.  Import `reflect-metadata` in your main file (e.g., `app.ts` or `server.ts`):

    ```tsx
    import 'reflect-metadata';
    ```

After these steps, you can use the `controllerFactory` feature as described in the usage section.

### Usage

In this example, `AuthController` uses the `AuthService` for authentication handling. The `controllerFactory` creates controller handlers, making method injection easy.

```tsx
// auth.service.ts
import {singleton} from "tsyringe";

@singleton()
export class AuthService {
	async signin(data: object){
		'''
	}

	async signup(data: object){
		'''
	}
}

// auth.controller.ts
import {singleton} from "tsyringe";
import {controllerFactory} from "ex-lite";
import {AuthService} from "./services";

@singleton()
export class AuthController {
  constructor(private authService: AuthService) {}

  /** signin request handler */
  async signin(req, res) {
    const { access, refresh, user } = await this.authService.signin(req.body);
    res.cookie("access-token", access.token, {
      httpOnly: true,
      maxAge: access.maxAge,
    });
    res.cookie("refresh-token", refresh.token, {
      httpOnly: true,
      maxAge: refresh.maxAge,
    });
    return ApiRes.ok(user.id, "User logged in successfully");
  }

	/** signup request handler */
  async signup(req) {
    const user = await this.authService.signup(req.body);
    return ApiRes.created(user.id, "User created successfully");
  }
}

// Create controller handlers with resolve dependency
const authController = controllerFactory(AuthController);

// auth.router.ts
router.post("/signin", authController.getMethod("signin"));
router.post("/signup", authController.getMethod("signup"));
```

**_Note:_** _The `controllerFactory` is an optional feature that allows you to use `tsyringe` for dependency injection in your controllers. This is especially useful for larger applications where different services need to be injected into controllers._

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## License

`ex-lite` is licensed under the MIT License. See the `LICENSE` file for more information.

---

**Disclaimer:** This library is currently under development. While contributions are appreciated, there is no need to start begging for features or fixes.
