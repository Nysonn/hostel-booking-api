import { pgTable, uuid, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { roomTypeEnum } from "./enums";
import { hostels } from "./hostels";

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostelId: uuid("hostel_id").references(() => hostels.id).notNull(),
  roomType: roomTypeEnum("room_type").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  occupiedSlots: integer("occupied_slots").default(0).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
