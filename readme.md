# Natours Application ⛰️

## Project Overview

Natours is a comprehensive backend application for a fictional tour booking website. It serves as a practical project demonstrating a wide array of Node.js, Express.js, and MongoDB concepts. The application provides a RESTful API for managing tours, users, reviews, and bookings, and also includes server-side rendered pages for user interaction.

Key features include:

*   **RESTful API:** Well-defined API endpoints for CRUD (Create, Read, Update, Delete) operations on:
    *   Tours (`/api/v1/tours`)
    *   Users (`/api/v1/users`)
    *   Reviews (`/api/v1/reviews`)
    *   Bookings (`/api/v1/bookings`)
*   **Server-Side Rendering:** Utilizes Pug as a template engine to render dynamic HTML pages for the front-end views (e.g., tour overviews, user profiles).
*   **User Authentication & Authorization:** (Typically a core part of this project in the course, involving JWT, password hashing, and role-based access control, though the specifics are in user controllers/models rather than `app.js` directly).
*   **Advanced Mongoose Features:** (Implied by the course structure) Leverages Mongoose for data modeling, schema validation, virtual properties, middleware, and advanced querying.
*   **Security Focused:** Implements multiple layers of security:
    *   Secure HTTP headers with Helmet (including a detailed Content Security Policy).
    *   Rate limiting to prevent brute-force and denial-of-service attacks.
    *   Data sanitization against NoSQL query injection and Cross-Site Scripting (XSS).
    *   Prevention of HTTP Parameter Pollution.
*   **Error Handling:** Robust global error handling mechanism to catch and process operational and programmer errors gracefully.
*   **Static File Serving:** Serves static assets like CSS, client-side JavaScript, and images.

## How it's Built (Node.js Implementation)

This project is built using Node.js and showcases a modern backend architecture:

*   **Core Framework:** Built on **Node.js**, utilizing the **Express.js** web application framework to structure the backend, handle HTTP requests, define routes, and manage middleware.
*   **RESTful API Design:** Exposes a set of RESTful API endpoints for CRUD operations. API routes are versioned (e.g., `/api/v1/`) for better maintainability.
*   **Modular Routing:** Employs **Express Router** to organize routes into separate modules (e.g., `tourRoutes.js`, `userRoutes.js`, `viewRoutes.js`). These routers are then "mounted" onto specific base paths in the main `app.js` file, promoting a clean and scalable codebase.
*   **Database & ODM:**
    *   Uses **MongoDB** as its NoSQL document database to store application data like tours, users, and reviews.
    *   Integrates **Mongoose** as an Object Data Modeling (ODM) library. Mongoose is used to define data schemas with validation, model application data, and interact with the MongoDB database in an object-oriented manner.
*   **Server-Side Rendering (SSR) with Pug:**
    *   Utilizes **Pug** (formerly Jade) as the template engine for generating dynamic HTML content on the server.
    *   The `app.set('view engine', 'pug')` and `app.set('views', path.join(__dirname, 'views'))` configurations in `app.js` set up Pug.
    *   A dedicated `viewRouter` handles requests to server-rendered pages, fetching data and passing it to Pug templates which are then rendered and sent to the client's browser.
*   **Middleware Pipeline:** Leverages an extensive chain of middleware functions to process incoming requests and outgoing responses. The order of middleware in `app.js` is crucial:
    *   **Security Middleware:**
        *   `helmet`: Sets various HTTP headers to protect against common web vulnerabilities. A detailed Content Security Policy (CSP) is configured to control resource loading.
        *   `express-rate-limit`: Prevents abuse by limiting the number of API requests from a single IP address within a given time window.
        *   `express-mongo-sanitize`: Protects against NoSQL query injection attacks by stripping out MongoDB operators (like `$` and `.`) from request inputs (`req.body`, `req.query`, `req.params`).
        *   `xss-clean`: Sanitizes user input to prevent cross-site scripting (XSS) attacks by escaping HTML characters.
        *   `hpp` (HTTP Parameter Pollution): Guards against attacks where an attacker might try to override parameters by sending duplicate query string keys. A whitelist allows specific parameters to be duplicated.
    *   **Request Processing & Parsing:**
        *   `express.json({ limit: '10kb' })`: Parses incoming JSON request bodies and makes them available under `req.body`. It also limits the size of the JSON payload.
        *   `cookie-parser`: Parses cookies attached to client requests and makes them available in `req.cookies`.
        *   `express.static(path.join(__dirname, 'public'))`: Serves static files (like CSS, client-side JavaScript, images) directly from the `public` directory.
    *   **Logging:**
        *   `morgan('dev')`: Used for HTTP request logging during development, providing insights into request method, URL, status code, and response time. This is conditionally applied based on `process.env.NODE_ENV`.
    *   **Custom Middleware:** Includes custom middleware, such as one to add a `requestTime` property (the current timestamp) to the request object for potential use in handlers.
*   **Error Handling Strategy:** Features a comprehensive and centralized error handling strategy:
    *   A custom `AppError` class (from `./utils/appError`) is used to create user-friendly operational errors with specific status codes and messages.
    *   A global error handling middleware (`globalErrorHandler` from `./controllers/errorController`) is defined as the last middleware in the stack. It takes four arguments (`err, req, res, next`), allowing Express to recognize it as an error handler. This middleware is responsible for sending appropriate error responses to the client, distinguishing between operational errors and programming errors, and providing different levels of detail for development and production environments.
    *   A catch-all route (`app.all('*', ...)`) is implemented before the global error handler. If no other route matches the request, this handler creates an `AppError` with a 404 status code and passes it to the global error handler.
*   **Environment Configuration:** (Implied by `process.env.NODE_ENV` and standard practice in the course)
    *   The application likely uses environment variables (e.g., managed via a `.env` file and the `dotenv` package, though not explicitly shown in `app.js`) for configuration settings such as database connection strings, JWT secrets, API keys, and port numbers. This allows for different configurations between development, testing, and production environments.

## Acknowledgements

This "Natours" project is a core part of the curriculum from **Jonas Schmedtmann's** course: **"Node.js, Express, MongoDB & More: The Complete Bootcamp"**. A big thank you to Jonas Schmedtmann for the excellent instruction, comprehensive explanations, and engaging project ideas that were instrumental in understanding these backend development concepts.
