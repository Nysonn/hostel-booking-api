import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { genderEnum } from "./enums";
import { users } from "./users";
import { universities } from "./universities";

export const landlords = pgTable("landlords", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  universityId: uuid("university_id").references(() => universities.id).notNull(),
  fullName: text("full_name").notNull(),
  gender: genderEnum("gender").notNull(),
  nin: text("nin").notNull(),
  maritalStatus: text("marital_status").notNull(),
  ownershipDocuments: text("ownership_documents").array().notNull().default([]),
  landlordCode: text("landlord_code").unique().notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Landlord = typeof landlords.$inferSelect;
export type NewLandlord = typeof landlords.$inferInsert;
