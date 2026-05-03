# Admin Login – Frontend Integration Guide

## Overview

A dedicated login endpoint has been added for the admin dashboard. It accepts admin credentials, verifies them, and returns the admin's profile data. All subsequent protected requests must include a valid Clerk session token in the `Authorization` header.

---

## Authentication Flow

```
1. POST /api/admin/login  →  backend verifies credentials → returns admin profile
2. Sign in via Clerk (frontend SDK)  →  obtain session token
3. All protected API calls  →  include Authorization: Bearer <session_token>
```

**Why two steps?** This API uses Clerk for session management. The login endpoint verifies that the credentials belong to an admin account; Clerk's SDK is used on the frontend to obtain the session token that protects all other routes.

---

## Login Endpoint

### `POST /api/admin/login`

**Public** — no Authorization header required.

#### Request Body

| Field      | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| `email`    | string | Yes      | Admin's email address    |
| `password` | string | Yes      | Admin's password         |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "clerkId": "clerk_user_id",
    "role": "admin",
    "email": "info@hostelbooking.com",
    "firstLogin": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

| HTTP Status | Condition                                      |
|-------------|------------------------------------------------|
| `401`       | Email not found or password is incorrect       |
| `403`       | Account exists but is not admin, or is suspended |
| `422`       | Missing or malformed request body fields       |

---

## Getting the Session Token (Clerk)

After a successful login response, use Clerk's frontend SDK to sign in and retrieve a session token.

### Using `@clerk/clerk-js`

```
const signIn = await clerk.client.signIn.create({
  identifier: email,
  password: password,
});
// Complete the sign-in flow and get the session token
const token = await signIn.createdSessionId;
```

Or if you use React with `@clerk/react` / `@clerk/nextjs`, use the `useSignIn` hook and call `signIn.create({ identifier, password })`.

### Using the token on API calls

Every protected request must include:

```
Authorization: Bearer <clerk_session_token>
```

You can obtain the raw JWT from an active Clerk session via `session.getToken()`.

---

## Protected Admin Endpoints

All routes below require `Authorization: Bearer <session_token>` and the authenticated user must have the `admin` role.

| Method   | Path                              | Description                            |
|----------|-----------------------------------|----------------------------------------|
| `GET`    | `/api/admin/me`                   | Get logged-in admin's profile          |
| `GET`    | `/api/admin/users`                | List all non-admin users (filterable by `?role=landlord\|student\|university`) |
| `GET`    | `/api/admin/universities`         | List all universities                  |
| `GET`    | `/api/admin/landlords`            | List all landlords                     |
| `GET`    | `/api/admin/students`             | List all students                      |
| `PATCH`  | `/api/admin/users/:userId/suspend`   | Suspend a user account              |
| `PATCH`  | `/api/admin/users/:userId/unsuspend` | Reactivate a suspended user         |
| `DELETE` | `/api/admin/users/:userId`        | Delete a user and all related data     |
| `POST`   | `/api/admin/universities`         | Create a new university account        |

---

## Standard Response Shape

All API responses follow this shape:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... } | null
}
```

Errors also follow this shape, with `success: false` and an optional `errors` field for validation failures.

---

## Notes for the Frontend Team

- **Base URL**: `http://<host>/api` — confirm the production host with the backend team.
- **CORS**: Currently configured for `http://localhost:8080`. The production origin must be added before deployment.
- **`firstLogin` flag**: When the `data.firstLogin` field is `true` after login, the admin is signing in for the first time. You may use this to prompt a password-change screen.
- **Session token expiry**: Clerk session tokens are short-lived. Use Clerk's `session.getToken()` which automatically refreshes the token before expiry; do not cache tokens manually.
