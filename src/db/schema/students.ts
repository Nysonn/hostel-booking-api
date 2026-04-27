import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { genderEnum } from "./enums";
import { users } from "./users";
import { universities } from "./universities";

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  universityId: uuid("university_id").references(() => universities.id).notNull(),
  registrationNumber: text("registration_number").unique().notNull(),
  surname: text("surname").notNull(),
  otherNames: text("other_names").notNull(),
  gender: genderEnum("gender").notNull(),
  studentEmail: text("student_email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
