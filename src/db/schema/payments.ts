import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { paymentTypeEnum, paymentMethodEnum, paymentStatusEnum } from "./enums";
import { bookings } from "./bookings";
import { students } from "./students";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
