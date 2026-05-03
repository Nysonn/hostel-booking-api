# Flutter Frontend Integration Guide

This document summarises the new and updated API endpoints introduced in this release. All endpoints follow the same response envelope:

```
{
  "success": true | false,
  "message": "...",
  "data": { ... } | null
}
```

All protected endpoints require a valid Clerk session token passed as a `Bearer` token in the `Authorization` header.

---

## 1. Me Endpoints (Profile)

Each role now has a `/me` endpoint that returns the authenticated user's own profile. These are all `GET` requests and require authentication + the appropriate role.

### Admin — GET /api/admin/me

Returns the admin user record. No separate profile table exists for admins.

**Response `data` fields:**
- `id` — internal user UUID
- `role` — always `"admin"`
- `isSuspended` — boolean
- `firstLogin` — boolean
- `createdAt`, `updatedAt`

---

### University — GET /api/university/me

Returns the university profile **plus room statistics** across all landlords registered under this university.

**Response `data` fields:**
- `id`, `role`, `isSuspended`, `firstLogin`, `createdAt`, `updatedAt` — user-level fields
- `profile` — university profile object
  - `id`, `universityName`, `location`, `type` (`"government"` | `"private"`), `email`, `createdAt`, `updatedAt`
- `roomStats` — aggregated room data
  - `totalRooms` — total number of rooms across all landlords in this university
  - `byLandlord` — array, one entry per landlord
    - `landlordId` — landlord record UUID
    - `fullName` — landlord's full name
    - `hostelCount` — number of hostels this landlord owns
    - `totalRooms` — number of rooms across this landlord's hostels

---

### Landlord — GET /api/landlord/me

Returns the landlord's own profile.

**Response `data` fields:**
- `id`, `role`, `isSuspended`, `firstLogin`, `createdAt`, `updatedAt` — user-level fields
- `profile` — landlord profile object
  - `id`, `universityId`, `fullName`, `gender`, `nin`, `maritalStatus`, `landlordCode`, `whatsappNumber`, `email`, `createdAt`, `updatedAt`

---

### Student — GET /api/student/me

Returns the student's own profile. Requires the student's account to not be suspended.

**Response `data` fields:**
- `id`, `role`, `isSuspended`, `firstLogin`, `createdAt`, `updatedAt` — user-level fields
- `profile` — student profile object
  - `id`, `universityId`, `registrationNumber`, `surname`, `otherNames`, `gender`, `studentEmail`, `createdAt`, `updatedAt`

---

## 2. University — Landlord Suspend / Unsuspend

A university can now suspend and reactivate landlords that belong to their institution.

### Suspend — PATCH /api/university/landlords/:userId/suspend

- `:userId` is the **user record ID** (`user.id`) of the landlord, not the landlord profile ID.
- Returns `data: null` on success.
- Returns `404` if the landlord does not exist or does not belong to this university.

### Unsuspend — PATCH /api/university/landlords/:userId/unsuspend

- Same URL pattern as above.
- Returns `data: null` on success.

> **Note:** To get the `userId` for a landlord, use the existing `GET /api/university/landlords` list endpoint — each landlord entry contains a `userId` field.

---

## 3. Add Landlord — Ownership Documents Removed

`POST /api/university/landlords`

The `ownership_documents` field and file upload have been **removed** from this endpoint. Do not send a multipart form anymore — send a plain JSON body instead.

**Required JSON body fields:**
- `full_name`
- `gender` (`"male"` | `"female"`)
- `nin`
- `marital_status`
- `whatsapp_number`
- `email`
- `password` (temporary password for the landlord's account)

---

## 4. Notification Count (Unread) — Student & Landlord

Returns the number of **unread** (new) notifications for the authenticated user.

### Student — GET /api/student/notifications/count
### Landlord — GET /api/landlord/notifications/count

**Response `data` fields:**
- `count` — integer, number of unread notifications

Use this endpoint to show a badge counter on the notification bell icon.

---

## 5. Mark All Notifications as Read — Student & Landlord

Marks all currently unread notifications for the authenticated user as read. Notifications that are already read are unaffected.

### Student — POST /api/student/notifications/mark-all-read
### Landlord — POST /api/landlord/notifications/mark-all-read

- No request body required.
- Returns `data: null` on success.
- After calling this endpoint, a subsequent call to the count endpoint will return `0`.

---

## Summary Table

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /api/admin/me | admin | Admin profile |
| GET | /api/university/me | university | University profile + room stats |
| GET | /api/landlord/me | landlord | Landlord profile |
| GET | /api/student/me | student | Student profile |
| PATCH | /api/university/landlords/:userId/suspend | university | Suspend a landlord |
| PATCH | /api/university/landlords/:userId/unsuspend | university | Reactivate a landlord |
| POST | /api/university/landlords | university | Register landlord (no file upload) |
| GET | /api/student/notifications/count | student | Unread notification count |
| POST | /api/student/notifications/mark-all-read | student | Mark all notifications read |
| GET | /api/landlord/notifications/count | landlord | Unread notification count |
| POST | /api/landlord/notifications/mark-all-read | landlord | Mark all notifications read |
