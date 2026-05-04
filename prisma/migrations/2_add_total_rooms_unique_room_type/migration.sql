-- Migration: add total_rooms column and enforce unique (hostel_id, room_type) per hostel

-- Step 1: add the new column, default to 1 so existing rows are valid temporarily
ALTER TABLE "rooms" ADD COLUMN "total_rooms" INTEGER NOT NULL DEFAULT 1;

-- Step 2: data migration
--   Old meaning of capacity = number of physical rooms for that type
--   New meaning of capacity = max occupants per physical room (1 for single, 2 for double)
--   So: new total_rooms = old capacity, new capacity = room-type occupancy
UPDATE "rooms"
SET "total_rooms" = "capacity",
    "capacity"    = CASE
                      WHEN "room_type" = 'single_self_contained' THEN 1
                      ELSE 2
                    END;

-- Step 3: reassign any bookings that point to a duplicate (non-keeper) room row
--         to the keeper row (MIN id for each hostel+room_type group)
UPDATE "bookings" b
SET "room_id" = keeper.keep_id
FROM (
  SELECT MIN(id) AS keep_id, hostel_id, room_type
  FROM   "rooms"
  GROUP  BY hostel_id, room_type
  HAVING COUNT(*) > 1
) keeper
JOIN "rooms" dup
  ON  dup.hostel_id = keeper.hostel_id
  AND dup.room_type = keeper.room_type
  AND dup.id       != keeper.keep_id
WHERE b.room_id = dup.id;

-- Step 4: merge totals (total_rooms + occupied_slots) into the keeper row
UPDATE "rooms" r
SET
  "total_rooms"    = agg.sum_total_rooms,
  "occupied_slots" = agg.sum_occupied_slots,
  "is_available"   = (agg.sum_occupied_slots < agg.sum_total_rooms * r.capacity)
FROM (
  SELECT
    MIN(id)             AS keep_id,
    hostel_id,
    room_type,
    SUM(total_rooms)    AS sum_total_rooms,
    SUM(occupied_slots) AS sum_occupied_slots
  FROM   "rooms"
  GROUP  BY hostel_id, room_type
  HAVING COUNT(*) > 1
) agg
WHERE r.id = agg.keep_id;

-- Step 5: delete the non-keeper duplicate rows
DELETE FROM "rooms" r
WHERE EXISTS (
  SELECT 1
  FROM (
    SELECT MIN(id) AS keep_id, hostel_id, room_type
    FROM   "rooms"
    GROUP  BY hostel_id, room_type
    HAVING COUNT(*) > 1
  ) agg
  WHERE agg.hostel_id = r.hostel_id
    AND agg.room_type = r.room_type
    AND agg.keep_id  != r.id
);

-- Step 6: add unique constraint — one Room row per (hostel, room_type)
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_hostel_id_room_type_key" UNIQUE ("hostel_id", "room_type");
