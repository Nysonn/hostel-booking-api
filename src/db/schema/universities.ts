import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { universityTypeEnum } from "./enums";
import { users } from "./users";

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  universityName: text("university_name").notNull(),
  location: text("location").notNull(),
  type: universityTypeEnum("type").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;
