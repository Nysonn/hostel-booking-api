import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { landlords } from "./landlords";
import { universities } from "./universities";

export const hostels = pgTable("hostels", {
  id: uuid("id").primaryKey().defaultRandom(),
  landlordId: uuid("landlord_id").references(() => landlords.id).notNull(),
  universityId: uuid("university_id").references(() => universities.id).notNull(),
  hostelName: text("hostel_name").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  whatsappNumber: text("whatsapp_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Hostel = typeof hostels.$inferSelect;
export type NewHostel = typeof hostels.$inferInsert;
