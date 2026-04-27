import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  bookings,
  hostels,
  landlords,
  payments,
  rooms,
  students,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export async function findStudentByUserId(userId: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);
  return student ?? null;
}

// ---------------------------------------------------------------------------
// Booking + room (validates ownership, fetches price)
// ---------------------------------------------------------------------------

export async function findBookingWithRoom(
  bookingId: string,
  studentId: string
) {
  const [result] = await db
    .select({ booking: bookings, room: rooms })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.studentId, studentId))
    )
    .limit(1);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// Existing payment checks
// ---------------------------------------------------------------------------

export async function findExistingPayments(bookingId: string) {
  const existing = await db
    .select({ paymentType: payments.paymentType })
    .from(payments)
    .where(
      and(eq(payments.bookingId, bookingId), eq(payments.status, "success"))
    );

  return {
    hasPartial: existing.some((p) => p.paymentType === "partial"),
    hasFull: existing.some((p) => p.paymentType === "full"),
  };
}

// ---------------------------------------------------------------------------
// Insert payment
// ---------------------------------------------------------------------------

export async function createPayment(data: {
  bookingId: string;
  studentId: string;
  amount: number;
  paymentType: "partial" | "full";
  paymentMethod: "mtn_mobile_money" | "airtel_mobile_money";
}) {
  const [newPayment] = await db
    .insert(payments)
    .values({
      bookingId: data.bookingId,
      studentId: data.studentId,
      amount: String(data.amount),
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      status: "success",
    })
    .returning();
  return newPayment;
}

// ---------------------------------------------------------------------------
// Context for emails + notifications
// ---------------------------------------------------------------------------

export async function findPaymentContext(paymentId: string) {
  const [result] = await db
    .select({
      payment: payments,
      student: students,
      hostel: hostels,
      landlord: landlords,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(students, eq(bookings.studentId, students.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
    .innerJoin(landlords, eq(hostels.landlordId, landlords.id))
    .where(eq(payments.id, paymentId))
    .limit(1);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// List payments for a booking
// ---------------------------------------------------------------------------

export function findPaymentsByBookingId(bookingId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .orderBy(desc(payments.createdAt));
}
