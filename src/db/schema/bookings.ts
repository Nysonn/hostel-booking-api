import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { bookingStatusEnum } from "./enums";
import { students } from "./students";
import { rooms } from "./rooms";

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  roomId: uuid("room_id").references(() => rooms.id).notNull(),
  status: bookingStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
