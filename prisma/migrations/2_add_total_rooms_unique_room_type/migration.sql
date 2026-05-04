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

-- Step 3: add unique constraint — one Room row per (hostel, room_type)
ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_hostel_id_room_type_key" UNIQUE ("hostel_id", "room_type");
