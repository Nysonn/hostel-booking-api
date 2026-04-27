import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "university", "landlord", "student"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const universityTypeEnum = pgEnum("university_type", ["government", "private"]);
export const roomTypeEnum = pgEnum("room_type", ["single_self_contained", "double_self_contained"]);
export const bookingStatusEnum = pgEnum("booking_status", ["active", "terminated"]);
export const paymentTypeEnum = pgEnum("payment_type", ["partial", "full"]);
export const paymentMethodEnum = pgEnum("payment_method", ["mtn_mobile_money", "airtel_mobile_money"]);
export const paymentStatusEnum = pgEnum("payment_status", ["success", "failed"]);
