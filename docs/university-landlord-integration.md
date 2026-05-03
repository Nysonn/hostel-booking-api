# University – Create Landlord Endpoint Integration Guide

## Overview

This guide covers how a university creates a landlord user account. On success the API returns the new landlord's unique **landlord code**, which the landlord uses when logging in for the first time and when affiliating their hostels with the university.

All protected university routes require a valid Clerk session token in the `Authorization` header.

---

## Endpoint

### `POST /api/university/landlords`

**Protected** — requires `Authorization: Bearer <session_token>` and a `university` role.

---

### Request Headers

| Header          | Value                          |
|-----------------|--------------------------------|
| `Authorization` | `Bearer <clerk_session_token>` |
| `Content-Type`  | `application/json`             |

---

### Request Body

| Field             | Type                   | Required | Description                                  |
|-------------------|------------------------|----------|----------------------------------------------|
| `full_name`       | string                 | Yes      | Landlord's full legal name                   |
| `gender`          | `"male"` \| `"female"` | Yes      | Landlord's gender                            |
| `nin`             | string                 | Yes      | National Identification Number               |
| `marital_status`  | string                 | Yes      | Marital status (e.g. `"single"`, `"married"`) |
| `whatsapp_number` | string                 | Yes      | Landlord's WhatsApp phone number             |
| `email`           | string (email)         | Yes      | Landlord's email address (used to log in)    |
| `password`        | string (min 8 chars)   | Yes      | Temporary password set by the university     |

#### Example Request

```json
{
  "full_name": "John Doe",
  "gender": "male",
  "nin": "CM90123456",
  "marital_status": "single",
  "whatsapp_number": "+256700000000",
  "email": "john.doe@example.com",
  "password": "Temp@1234"
}
```

---

### Success Response — `201 Created`

The response includes the newly generated `landlordCode` as the first field. Share or display this code to the university administrator — the landlord will need it to identify themselves within the platform.

```json
{
  "success": true,
  "message": "Landlord registered successfully",
  "data": {
    "landlordCode": "A1B2C3D4",
    "id": "uuid",
    "userId": "uuid",
    "universityId": "uuid",
    "fullName": "John Doe",
    "gender": "male",
    "email": "john.doe@example.com",
    "whatsappNumber": "+256700000000",
    "maritalStatus": "single",
    "nin": "CM90123456",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Key field: `data.landlordCode`

| Field          | Type   | Description                                                                 |
|----------------|--------|-----------------------------------------------------------------------------|
| `landlordCode` | string | 8-character alphanumeric code (A–Z, 0–9) uniquely assigned to the landlord. Display this to the university admin immediately after creation. The landlord will use this code to sign in and link their hostels. |

---

### Error Responses

| HTTP Status | Condition                                                          |
|-------------|--------------------------------------------------------------------|
| `401`       | Missing or invalid session token                                   |
| `403`       | Authenticated user is not a university, or account is suspended    |
| `404`       | University profile not found for the authenticated user            |
| `409`       | A landlord with the provided email already exists                  |
| `422`       | Missing or invalid request body fields (see validation rules above)|

---

## Post-Creation Flow

After the landlord is created:

1. **Show `landlordCode` to the university admin** — present it in a modal or copyable text field immediately after the `201` response. It is not re-displayed anywhere in the dashboard after this.
2. **The landlord receives a registration email** — the backend automatically sends an email to `data.email` containing the `landlordCode` and the temporary password set by the university.
3. **Landlord first login** — the landlord logs in using the temporary password. On first login (`firstLogin: true`), the landlord must reset their password via `POST /api/landlord/auth/reset-password`.

---

## Related Endpoints

| Method  | Path                                    | Description                        |
|---------|-----------------------------------------|------------------------------------|
| `GET`   | `/api/university/landlords`             | List all landlords for this university |
| `PATCH` | `/api/university/landlords/:userId/suspend`   | Suspend a landlord account   |
| `PATCH` | `/api/university/landlords/:userId/unsuspend` | Reactivate a landlord account |
