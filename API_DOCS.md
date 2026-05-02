# Hostel Booking API — Frontend Integration Guide

**Base URL:** `https://hostel-booking-api.onrender.com/api`

---

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [General Notes for Frontend Teams](#general-notes-for-frontend-teams)
3. [Recommended Packages](#recommended-packages)
4. [Response Format](#response-format)
5. [Admin Endpoints (React Web App)](#admin-endpoints-react-web-app)
6. [University Endpoints (Flutter Mobile App)](#university-endpoints-flutter-mobile-app)
7. [Landlord Endpoints (Flutter Mobile App)](#landlord-endpoints-flutter-mobile-app)
8. [Student Endpoints (Flutter Mobile App)](#student-endpoints-flutter-mobile-app)
9. [Booking Endpoints (Flutter Mobile App — Student)](#booking-endpoints-flutter-mobile-app--student)
10. [Payment Endpoints (Flutter Mobile App — Student)](#payment-endpoints-flutter-mobile-app--student)

---

## Authentication Overview

This API uses **Clerk** for authentication. Every protected endpoint requires a valid JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
```

**How Clerk Login Works (Flutter / React):**

- The user logs in directly through Clerk's hosted UI or SDK. After a successful login, Clerk provides a session token (JWT).
- This token must be attached to every API request as a Bearer token.
- Tokens expire after 60 seconds. Use the Clerk SDK's built-in `getToken()` method — it automatically refreshes the session and returns a fresh token. Always call `getToken()` immediately before making a request, never store it long-term.

**Role-based Access:**

| Role         | App          |
|--------------|--------------|
| `admin`      | Web (React)  |
| `university` | Mobile (Flutter) |
| `landlord`   | Mobile (Flutter) |
| `student`    | Mobile (Flutter) |

Attempting to access an endpoint with the wrong role returns `403 Forbidden`.

---

## General Notes for Frontend Teams

### Flutter Team

- Do not hardcode or use any dummy/mock data in the final app. Every screen must be powered by a real API call.
- Use the Clerk Flutter SDK to handle login and session management. After login, retrieve the JWT using `getToken()` and pass it to every API call.
- A user with `firstLogin: true` on their profile is on their **first login** and must be directed to the reset password screen before accessing the main app.
- When a user is suspended (`isSuspended: true`), requests return `403`. Handle this state globally and show the user a suspension notice screen.
- Images and file uploads are sent as `multipart/form-data`. All other requests are `application/json`.
- Notifications are poll-based — fetch from the notifications endpoint periodically or on app focus.

### React (Admin) Web Team

- Do not hardcode or use any dummy/mock data in the final admin dashboard. All data must come from the API.
- The admin user is created via the seed script. There is no self-registration route for admins.
- Admin actions (suspend, delete, create university) are destructive and irreversible — add confirmation dialogs in the UI.
- The admin JWT is obtained the same way as mobile: via Clerk session.

---

## Recommended Packages

### Flutter

| Package | Purpose |
|---------|---------|
| `dio` | HTTP client. Supports interceptors, making it easy to attach the Clerk JWT to every request automatically via a request interceptor. |
| `provider` or `riverpod` | State management. Use this to store and expose auth state (token, user profile, role) across the app. |
| `clerk_flutter` | Official Clerk Flutter SDK. Use this for sign-in, session management, and retrieving the JWT. |
| `flutter_secure_storage` | Store sensitive values (e.g., the Clerk session reference) securely on the device. |
| `image_picker` | Selecting images from the camera or gallery for hostel image uploads. |
| `cached_network_image` | Efficiently load and cache hostel images returned from the API (Cloudinary URLs). |

**Recommended Setup (Dio + JWT Interceptor):**

Set up a single Dio instance with an interceptor that calls `getToken()` from the Clerk SDK before every request and injects the result as the `Authorization: Bearer` header. This way, every API call in the app automatically has a valid, fresh token without any manual token handling per screen.

### React (Admin Web)

| Package | Purpose |
|---------|---------|
| `@clerk/clerk-react` | Official Clerk React SDK. Provides hooks like `useAuth()` to get the current session token. |
| `axios` | HTTP client. Configure an axios instance with an interceptor that calls `getToken()` from `useAuth()` before each request. |
| `react-query` (TanStack Query) | Server state management. Handles caching, loading states, and automatic refetching for API data on the dashboard. |
| `react-hook-form` + `zod` | Form handling and validation for creating universities and other admin forms. |

---

## Response Format

All responses follow this consistent structure:

**Success:**
```json
{
  "success": true,
  "message": "A human-readable description",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["error detail"]
  }
}
```

---

## Admin Endpoints (React Web App)

All admin endpoints require the admin JWT and return `403` if called by any other role.

---

### Get All Users

**Screen:** User Management Dashboard — lists all non-admin users. Supports filtering by role using a query parameter.

- **Method:** GET
- **URL:** `/admin/users`
- **Query Parameters:**

| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `role` | string | No | `university`, `landlord`, `student` |

- **Response:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "uuid",
      "clerkId": "clerk_id",
      "role": "student",
      "isSuspended": false,
      "firstLogin": false,
      "createdAt": "ISO date",
      "updatedAt": "ISO date",
      "profile": {
        "id": "uuid",
        "registrationNumber": "...",
        "surname": "...",
        "otherNames": "...",
        "gender": "male",
        "studentEmail": "..."
      }
    }
  ]
}
```

The `profile` field contains the role-specific data (university, landlord, or student object depending on the user's role). It is `null` if the user has not completed their profile.

---

### Get All Universities

**Screen:** Universities tab on the admin dashboard.

- **Method:** GET
- **URL:** `/admin/universities`
- **Response:**
```json
{
  "success": true,
  "message": "Universities fetched successfully",
  "data": [
    {
      "id": "uuid",
      "universityName": "Makerere University",
      "location": "Kampala",
      "type": "government",
      "email": "admin@mak.ac.ug",
      "createdAt": "ISO date",
      "user": { "id": "uuid", "role": "university", "isSuspended": false }
    }
  ]
}
```

---

### Get All Landlords

**Screen:** Landlords tab on the admin dashboard.

- **Method:** GET
- **URL:** `/admin/landlords`
- **Response:**
```json
{
  "success": true,
  "message": "Landlords fetched successfully",
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "gender": "male",
      "landlordCode": "AB12CD34",
      "email": "landlord@example.com",
      "university": { "id": "uuid", "universityName": "..." }
    }
  ]
}
```

---

### Get All Students

**Screen:** Students tab on the admin dashboard.

- **Method:** GET
- **URL:** `/admin/students`
- **Response:**
```json
{
  "success": true,
  "message": "Students fetched successfully",
  "data": [
    {
      "id": "uuid",
      "registrationNumber": "2021/CS/001",
      "surname": "Nakato",
      "otherNames": "Sarah",
      "gender": "female",
      "studentEmail": "nakato@student.mak.ac.ug",
      "university": { "id": "uuid", "universityName": "..." }
    }
  ]
}
```

---

### Suspend a User

**Screen:** User detail page — admin takes action to suspend a user account.

- **Method:** PATCH
- **URL:** `/admin/users/:userId/suspend`
- **URL Params:** `userId` — the internal UUID of the user (from the users list, not the Clerk ID)
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": null
}
```

---

### Unsuspend a User

**Screen:** User detail page — admin reactivates a previously suspended account.

- **Method:** PATCH
- **URL:** `/admin/users/:userId/unsuspend`
- **URL Params:** `userId` — the internal UUID of the user
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "User reactivated successfully",
  "data": null
}
```

---

### Delete a User

**Screen:** User detail page — admin permanently removes a user and all their associated data.

- **Method:** DELETE
- **URL:** `/admin/users/:userId`
- **URL Params:** `userId` — the internal UUID of the user
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

> This is a destructive action. Deleting a university user cascades and removes all associated landlords, students, hostels, rooms, bookings, and payments. Always show a confirmation dialog before calling this.

---

### Create a University

**Screen:** "Add University" form on the admin dashboard. The admin creates a university account — the credentials are sent to the university via email automatically.

- **Method:** POST
- **URL:** `/admin/universities`
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `university_name` | string | Yes | |
| `location` | string | Yes | |
| `type` | string | Yes | `government` or `private` |
| `email` | string | Yes | Must be a valid email |
| `password` | string | Yes | Minimum 8 characters. This becomes the university's initial login password. |

```json
{
  "university_name": "Makerere University",
  "location": "Kampala, Uganda",
  "type": "government",
  "email": "admin@mak.ac.ug",
  "password": "SecurePass123"
}
```

- **Response (201):**
```json
{
  "success": true,
  "message": "University created successfully",
  "data": {
    "user": { "id": "uuid", "role": "university" },
    "university": { "id": "uuid", "universityName": "Makerere University", "email": "..." }
  }
}
```

> After creation, the university receives a welcome email with their login credentials. The `firstLogin` flag will be `true` for their account, meaning the university app should prompt them to reset their password on first login.

---

## University Endpoints (Flutter Mobile App)

These endpoints are for the **university role** within the Flutter mobile app.

---

### Reset Password (First Login)

**Screen:** Reset Password screen. This screen must be shown automatically when a university user logs in and `firstLogin` is `true`. They cannot proceed to the main app until they change their password.

- **Method:** POST
- **URL:** `/university/auth/reset-password`
- **Headers:** `Authorization: Bearer <token>` (university role required)
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `new_password` | string | Yes | Minimum 8 characters |

```json
{
  "new_password": "MyNewSecurePass1"
}
```

- **Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": null
}
```

---

### Logout

**Screen:** Profile/Settings screen — logout button.

- **Method:** POST
- **URL:** `/university/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

> After a successful logout response, also call the Clerk SDK's sign-out method to clear the local session.

---

### Register a Landlord

**Screen:** "Add Landlord" form screen. The university registers a new landlord. Ownership documents are uploaded as files in this request.

- **Method:** POST
- **URL:** `/university/landlords`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body (multipart/form-data):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `full_name` | string | Yes | |
| `gender` | string | Yes | `male` or `female` |
| `nin` | string | Yes | National Identification Number |
| `marital_status` | string | Yes | e.g., `single`, `married` |
| `whatsapp_number` | string | Yes | |
| `email` | string | Yes | Becomes the landlord's login email |
| `password` | string | Yes | Minimum 8 characters. Landlord's initial password |
| `ownership_documents` | file(s) | No | Up to 10 files (images or PDFs of property ownership docs) |

- **Response (201):**
```json
{
  "success": true,
  "message": "Landlord registered successfully",
  "data": {
    "user": { "id": "uuid", "role": "landlord" },
    "landlord": {
      "id": "uuid",
      "fullName": "John Doe",
      "landlordCode": "AB12CD34",
      "email": "landlord@example.com"
    }
  }
}
```

> The landlord receives an email with their login credentials and unique landlord code automatically. Their `firstLogin` will be `true`, so the landlord app will prompt a password reset on first login.

---

### Get Landlords

**Screen:** Landlords list screen — shows all landlords registered under this university.

- **Method:** GET
- **URL:** `/university/landlords`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Landlords fetched successfully",
  "data": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "gender": "male",
      "landlordCode": "AB12CD34",
      "whatsappNumber": "+256700000000",
      "email": "landlord@example.com"
    }
  ]
}
```

---

### Get Students

**Screen:** Students list screen — shows all students registered under this university.

- **Method:** GET
- **URL:** `/university/students`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Students fetched successfully",
  "data": [
    {
      "id": "uuid",
      "registrationNumber": "2021/CS/001",
      "surname": "Nakato",
      "otherNames": "Sarah",
      "gender": "female",
      "studentEmail": "nakato@student.mak.ac.ug"
    }
  ]
}
```

---

### Get Hostels

**Screen:** Hostels overview screen — shows all hostels associated with landlords under this university.

- **Method:** GET
- **URL:** `/university/hostels`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Hostels fetched successfully",
  "data": [
    {
      "id": "uuid",
      "hostelName": "Green Valley Hostel",
      "location": "Near Main Gate",
      "description": "A comfortable hostel with all amenities.",
      "images": ["https://cloudinary.com/..."],
      "whatsappNumber": "+256700000000",
      "rooms": [
        {
          "id": "uuid",
          "roomType": "single_self_contained",
          "price": "500000.00",
          "capacity": 1,
          "occupiedSlots": 0,
          "isAvailable": true
        }
      ]
    }
  ]
}
```

---

## Landlord Endpoints (Flutter Mobile App)

These endpoints are for the **landlord role** within the Flutter mobile app.

---

### Reset Password (First Login)

**Screen:** Reset Password screen. Must be shown when `firstLogin` is `true` on the landlord's profile. The landlord cannot access the main app until this is done.

- **Method:** POST
- **URL:** `/landlord/auth/reset-password`
- **Headers:** `Authorization: Bearer <token>` (landlord role required)
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `new_password` | string | Yes | Minimum 8 characters |

```json
{
  "new_password": "MyNewSecurePass1"
}
```

- **Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": null
}
```

---

### Logout

**Screen:** Profile/Settings screen — logout button.

- **Method:** POST
- **URL:** `/landlord/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### Create a Hostel

**Screen:** "Add Hostel" form screen. The landlord creates a new hostel listing with photos.

- **Method:** POST
- **URL:** `/landlord/hostels`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body (multipart/form-data):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `hostel_name` | string | Yes | |
| `location` | string | Yes | |
| `description` | string | Yes | |
| `whatsapp_number` | string | Yes | |
| `images` | file(s) | No | Up to 10 image files for the hostel gallery |

- **Response (201):**
```json
{
  "success": true,
  "message": "Hostel created successfully",
  "data": {
    "id": "uuid",
    "hostelName": "Green Valley Hostel",
    "location": "Near Main Gate",
    "description": "...",
    "images": ["https://cloudinary.com/..."],
    "whatsappNumber": "+256700000000"
  }
}
```

---

### Get My Hostels

**Screen:** Landlord home/dashboard screen — list of the landlord's hostels with their rooms and availability.

- **Method:** GET
- **URL:** `/landlord/hostels`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Hostels fetched successfully",
  "data": [
    {
      "id": "uuid",
      "hostelName": "Green Valley Hostel",
      "location": "Near Main Gate",
      "description": "...",
      "images": ["https://cloudinary.com/..."],
      "whatsappNumber": "+256700000000",
      "rooms": [
        {
          "id": "uuid",
          "roomType": "single_self_contained",
          "price": "500000.00",
          "capacity": 2,
          "occupiedSlots": 1,
          "isAvailable": true
        }
      ]
    }
  ]
}
```

---

### Get a Single Hostel

**Screen:** Hostel detail screen — full details of one hostel including all rooms.

- **Method:** GET
- **URL:** `/landlord/hostels/:hostelId`
- **URL Params:** `hostelId` — UUID of the hostel
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Same shape as a single item from Get My Hostels.

---

### Add a Room to a Hostel

**Screen:** "Add Room" form screen within a hostel's detail/management screen.

- **Method:** POST
- **URL:** `/landlord/hostels/:hostelId/rooms`
- **URL Params:** `hostelId` — UUID of the hostel
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `room_type` | string | Yes | `single_self_contained` or `double_self_contained` |
| `price` | number | Yes | Price per semester/period in UGX. Must be a positive number. |
| `capacity` | number | Yes | Total number of students the room can hold. Must be a positive integer. |

```json
{
  "room_type": "single_self_contained",
  "price": 500000,
  "capacity": 1
}
```

- **Response (201):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "id": "uuid",
    "roomType": "single_self_contained",
    "price": "500000.00",
    "capacity": 1,
    "occupiedSlots": 0,
    "isAvailable": true
  }
}
```

---

### Update a Room

**Screen:** "Edit Room" screen. The landlord can update a room's type, price, or capacity. Send only the fields you want to change.

- **Method:** PATCH
- **URL:** `/landlord/hostels/:hostelId/rooms/:roomId`
- **URL Params:** `hostelId`, `roomId`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON — all fields optional):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `room_type` | string | No | `single_self_contained` or `double_self_contained` |
| `price` | number | No | Positive number |
| `capacity` | number | No | Positive integer |

```json
{
  "price": 600000
}
```

- **Response:**
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "id": "uuid",
    "roomType": "single_self_contained",
    "price": "600000.00",
    "capacity": 1,
    "occupiedSlots": 0,
    "isAvailable": true
  }
}
```

---

### Get Notifications

**Screen:** Notifications screen. Shows the landlord's booking-related notifications (new bookings, terminations, payments received).

- **Method:** GET
- **URL:** `/landlord/notifications`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "uuid",
      "title": "New Booking",
      "body": "Nakato Sarah has booked a single self-contained room at Green Valley Hostel.",
      "type": "booking",
      "isRead": false,
      "createdAt": "ISO date"
    }
  ]
}
```

---

## Student Endpoints (Flutter Mobile App)

These endpoints are for the **student role**. Registration is public (no auth required).

---

### Get Universities (Public)

**Screen:** Registration screen — dropdown or searchable list of universities so the student can select theirs during sign-up.

- **Method:** GET
- **URL:** `/student/universities`
- **Headers:** None required
- **Response:**
```json
{
  "success": true,
  "message": "Universities fetched successfully",
  "data": [
    {
      "id": "uuid",
      "universityName": "Makerere University",
      "location": "Kampala",
      "type": "government"
    }
  ]
}
```

---

### Register a Student

**Screen:** Student registration screen. This is the self-registration form for new students. No login required to call this endpoint.

- **Method:** POST
- **URL:** `/student/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `registration_number` | string | Yes | University-issued student number |
| `surname` | string | Yes | |
| `other_names` | string | Yes | First and middle names |
| `gender` | string | Yes | `male` or `female` |
| `student_email` | string | Yes | Must be a valid email address |
| `password` | string | Yes | Minimum 8 characters |
| `university_id` | string | Yes | UUID from the Get Universities endpoint |

```json
{
  "registration_number": "2021/CS/001",
  "surname": "Nakato",
  "other_names": "Sarah Jane",
  "gender": "female",
  "student_email": "nakato@student.mak.ac.ug",
  "password": "SecurePass123",
  "university_id": "uuid-of-university"
}
```

- **Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "uuid", "role": "student" },
    "student": {
      "id": "uuid",
      "registrationNumber": "2021/CS/001",
      "surname": "Nakato",
      "otherNames": "Sarah Jane",
      "gender": "female",
      "studentEmail": "nakato@student.mak.ac.ug"
    }
  }
}
```

> After registration, the student should be directed to the Clerk login screen to sign in with the email and password they just registered with.

---

### Logout

**Screen:** Profile/Settings screen — logout button.

- **Method:** POST
- **URL:** `/student/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### Get Available Hostels

**Screen:** Hostel browsing/home screen. Shows all hostels available to the student's university with room details and availability.

- **Method:** GET
- **URL:** `/student/hostels`
- **Headers:** `Authorization: Bearer <token>` (student role required, account must not be suspended)
- **Response:**
```json
{
  "success": true,
  "message": "Hostels fetched successfully",
  "data": [
    {
      "id": "uuid",
      "hostelName": "Green Valley Hostel",
      "location": "Near Main Gate",
      "description": "A comfortable hostel close to the main library.",
      "images": ["https://cloudinary.com/..."],
      "whatsappNumber": "+256700000000",
      "rooms": [
        {
          "id": "uuid",
          "roomType": "single_self_contained",
          "price": "500000.00",
          "capacity": 1,
          "occupiedSlots": 0,
          "isAvailable": true
        }
      ]
    }
  ]
}
```

> Only show rooms where `isAvailable` is `true` on the booking screen. Use `room.id` when creating a booking.

---

### Get Hostel Details

**Screen:** Hostel detail screen — full info about a specific hostel including all rooms and the WhatsApp contact.

- **Method:** GET
- **URL:** `/student/hostels/:hostelId`
- **URL Params:** `hostelId` — UUID of the hostel
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Same shape as a single item from Get Available Hostels.

---

### Get Notifications

**Screen:** Notifications screen. Shows the student's booking and payment notifications.

- **Method:** GET
- **URL:** `/student/notifications`
- **Headers:** `Authorization: Bearer <token>` (student role required)
- **Response:**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Booking Confirmed",
      "body": "Your booking for a single self-contained room at Green Valley Hostel has been confirmed.",
      "type": "booking",
      "isRead": false,
      "createdAt": "ISO date"
    }
  ]
}
```

---

## Booking Endpoints (Flutter Mobile App — Student)

All booking endpoints require the student role and are mounted under `/student/bookings`.

---

### Create a Booking

**Screen:** Booking confirmation screen — student confirms they want to book a specific room.

- **Method:** POST
- **URL:** `/student/bookings`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `room_id` | string | Yes | UUID of the room to book. Use the `id` from the rooms list on the hostel detail screen. |

```json
{
  "room_id": "uuid-of-room"
}
```

- **Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "status": "active",
    "createdAt": "ISO date",
    "room": {
      "id": "uuid",
      "roomType": "single_self_contained",
      "price": "500000.00",
      "hostel": {
        "hostelName": "Green Valley Hostel",
        "location": "Near Main Gate"
      }
    }
  }
}
```

> After a successful booking, a confirmation email is sent to the student and the landlord is notified. Navigate the student to their bookings list or the payment screen for this booking.

---

### Terminate a Booking

**Screen:** Active booking detail screen — button to terminate/cancel an active booking.

- **Method:** POST
- **URL:** `/student/bookings/:bookingId/terminate`
- **URL Params:** `bookingId` — UUID of the booking
- **Headers:** `Authorization: Bearer <token>`
- **Body:** None
- **Response:**
```json
{
  "success": true,
  "message": "Booking terminated successfully",
  "data": {
    "id": "uuid",
    "status": "terminated",
    "updatedAt": "ISO date"
  }
}
```

---

### Get My Bookings

**Screen:** My Bookings screen — list of all the student's bookings (active and terminated).

- **Method:** GET
- **URL:** `/student/bookings`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": [
    {
      "id": "uuid",
      "status": "active",
      "createdAt": "ISO date",
      "room": {
        "id": "uuid",
        "roomType": "single_self_contained",
        "price": "500000.00",
        "hostel": {
          "hostelName": "Green Valley Hostel",
          "location": "Near Main Gate"
        }
      },
      "payments": []
    }
  ]
}
```

---

### Get a Single Booking

**Screen:** Booking detail screen — full details of one booking including payment history.

- **Method:** GET
- **URL:** `/student/bookings/:bookingId`
- **URL Params:** `bookingId` — UUID of the booking
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Same shape as a single item from Get My Bookings, including the `payments` array with all payment records for that booking.

---

## Payment Endpoints (Flutter Mobile App — Student)

Payment endpoints are mounted under `/student/bookings/:bookingId/payments`. Only students with active bookings can make payments.

---

### Make a Payment

**Screen:** Payment screen — student selects a payment method and type (partial or full) for a specific booking.

- **Method:** POST
- **URL:** `/student/bookings/:bookingId/payments`
- **URL Params:** `bookingId` — UUID of the booking being paid for
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body (JSON):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `payment_method` | string | Yes | `mtn_mobile_money` or `airtel_mobile_money` |
| `payment_type` | string | Yes | `partial` (pays half the room price) or `full` (pays the full room price) |

```json
{
  "payment_method": "mtn_mobile_money",
  "payment_type": "full"
}
```

- **Response (201):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "id": "uuid",
    "amount": "500000.00",
    "paymentType": "full",
    "paymentMethod": "mtn_mobile_money",
    "status": "success",
    "createdAt": "ISO date"
  }
}
```

> A payment confirmation email is sent to the student and the landlord is notified. Show a success screen and update the booking detail view.

---

### Get Payments for a Booking

**Screen:** Payment history screen within a booking's detail view — shows all payments made for that booking.

- **Method:** GET
- **URL:** `/student/bookings/:bookingId/payments`
- **URL Params:** `bookingId` — UUID of the booking
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "message": "Payments fetched successfully",
  "data": [
    {
      "id": "uuid",
      "amount": "250000.00",
      "paymentType": "partial",
      "paymentMethod": "airtel_mobile_money",
      "status": "success",
      "createdAt": "ISO date"
    }
  ]
}
```

---

## Common HTTP Status Codes

| Code | Meaning | What to do in the app |
|------|---------|-----------------------|
| 200 | Success | Render the data |
| 201 | Created | Navigate forward, show success state |
| 400 | Bad Request | Show the error message from the response |
| 401 | Unauthorized | The token is missing or invalid — redirect to the login screen |
| 403 | Forbidden | Either wrong role or account is suspended — show appropriate message |
| 404 | Not Found | Show a "not found" state in the UI |
| 409 | Conflict | Duplicate data (e.g., email already registered) — show field-level error |
| 422 | Validation Error | Form validation failed — display the `errors` object against the relevant fields |
| 500 | Server Error | Show a generic "something went wrong" message and do not expose details to the user |
