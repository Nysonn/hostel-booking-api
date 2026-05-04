# Room Model Update — Frontend Integration Guide

## Overview

The room data model has been updated to correctly support multiple physical rooms of the same type under one hostel. Two bugs are resolved by this change:

- **Double rooms appearing halved** — e.g. a landlord uploads 6 double rooms but the student view shows 3
- **Extra room type entries** — e.g. 3 room type cards shown when there are only 2 distinct types

---

## What Changed

### 1. Rooms now have two separate fields for count and occupancy

Previously, a single `capacity` field was used, which caused the frontend and backend to interpret it differently.

There are now two distinct fields:

| Field | Meaning |
|---|---|
| `total_rooms` | The number of physical rooms of this type the landlord has (e.g. 6 double rooms) |
| `capacity` | The maximum number of occupants per individual room (e.g. 2 for a double room) |
| `occupied_slots` | Total number of individual bed slots currently booked across all rooms of this type |
| `available_slots` | Total available bed slots = `total_rooms × capacity − occupied_slots` *(computed field returned on student-facing endpoints)* |

**Example:** A hostel with 6 double rooms at capacity 2 has 12 total bed slots. If 4 are occupied, `available_slots` = 8.

---

### 2. One room type per hostel

The API now enforces that a hostel can only have **one row per room type**. If a landlord submits a room type that already exists for that hostel, the existing record is updated (price, number of rooms, capacity) rather than creating a duplicate. This eliminates the duplicate room type entries.

---

## Landlord Side — Create / Update Room

### Endpoint

- `POST /landlord/hostels/:hostelId/rooms` — create or update a room type
- `PATCH /landlord/hostels/:hostelId/rooms/:roomId` — update an existing room type

### Breaking Change — `number_of_rooms` is now required on create

The request body for creating a room **must** now include `number_of_rooms`. `capacity` remains required and should reflect the max occupants per room, not the total number of rooms.

**Fields for create (POST):**

| Field | Type | Required | Description |
|---|---|---|---|
| `room_type` | `"single_self_contained"` or `"double_self_contained"` | Yes | The type of room |
| `price` | number (positive) | Yes | Price per slot/bed |
| `number_of_rooms` | integer (positive) | **Yes — new** | How many physical rooms of this type exist |
| `capacity` | integer (positive) | Yes | Max occupants per individual room |

**Fields for update (PATCH) — all optional:**

| Field | Type | Description |
|---|---|---|
| `room_type` | `"single_self_contained"` or `"double_self_contained"` | Room type |
| `price` | number (positive) | Price per slot/bed |
| `number_of_rooms` | integer (positive) | Physical room count |
| `capacity` | integer (positive) | Max occupants per room |

### Upsert behaviour on POST

Because only one row per room type is allowed, **posting a room type that already exists for the hostel will update it** — it will not return an error or create a second entry. The landlord form can safely call POST when both creating and editing by room type.

### Room object returned to landlord

All room objects now include the `total_rooms` field alongside the existing fields:

| Field | Type |
|---|---|
| `id` | string |
| `hostel_id` | string |
| `room_type` | string |
| `price` | string (decimal) |
| `total_rooms` | integer |
| `capacity` | integer |
| `occupied_slots` | integer |
| `is_available` | boolean |
| `created_at` | ISO timestamp |
| `updated_at` | ISO timestamp |

---

## Student Side — View Hostels / Rooms

No request changes are required on the student side. The response shape for room objects includes an extra computed field:

| Field | Type | Description |
|---|---|---|
| `available_slots` | integer | Total bookable slots remaining across all physical rooms of this type |

### How to display room availability

`available_slots` is the correct field to show to students. It already accounts for both the number of rooms and the occupants per room.

To display the number of remaining physical rooms (if needed for UI purposes), divide `available_slots` by `capacity`. For example, 8 available slots in a double room (`capacity` = 2) means 4 rooms still have at least one free bed.

### Availability state

`is_available` is set to `false` by the backend when `available_slots` reaches 0. Use this flag to mark a room type as fully booked in the UI.

---

## Student Side — Book a Room

No changes to the booking request. The backend now validates against total available slots (`total_rooms × capacity`) instead of the old `capacity` value, so booking behaviour is unchanged from the frontend's perspective.

---

## Summary of Breaking Changes

| Area | What must change |
|---|---|
| Landlord — create room form | Add `number_of_rooms` field to the request body |
| Landlord — room display | Read `total_rooms` instead of `capacity` to show physical room count |
| Student — available rooms display | Use `available_slots` directly; do not halve or derive it from `capacity` alone |
| Student — rooms count display | Use `available_slots / capacity` if you need to show remaining physical rooms |
