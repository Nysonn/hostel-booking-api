import {
  sendBookingConfirmationEmail,
  sendBookingNotificationToLandlord,
  sendTerminationConfirmationEmail,
  sendTerminationNotificationToLandlord,
} from "../../utils/email";
import { createNotification } from "../../utils/notification";
import * as repo from "./booking.repository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BookingContext = NonNullable<
  Awaited<ReturnType<typeof repo.findBookingContext>>
>;

async function requireStudent(userId: string) {
  const student = await repo.findStudentByUserId(userId);
  if (!student)
    throw Object.assign(new Error("Student profile not found"), { status: 404 });
  return student;
}

function studentFullName(ctx: BookingContext) {
  return `${ctx.student.surname} ${ctx.student.otherNames}`;
}

// Side effects are non-blocking — booking/termination succeeds regardless
function fireBookingCreatedSideEffects(ctx: BookingContext) {
  const studentName = studentFullName(ctx);
  const hostel = ctx.room.hostel;
  const landlord = ctx.room.hostel.landlord;

  Promise.allSettled([
    sendBookingConfirmationEmail({
      to: ctx.student.studentEmail,
      studentName,
      hostelName: hostel.hostelName,
      roomType: ctx.room.roomType,
      price: ctx.room.price.toString(),
    }),
    sendBookingNotificationToLandlord({
      to: landlord.email,
      landlordName: landlord.fullName,
      studentName,
      hostelName: hostel.hostelName,
      roomType: ctx.room.roomType,
    }),
    createNotification({
      userId: ctx.student.userId,
      title: "Booking Confirmed",
      body: `Your booking for a ${ctx.room.roomType} room at ${hostel.hostelName} has been confirmed.`,
      type: "booking",
    }),
    createNotification({
      userId: landlord.userId,
      title: "New Booking",
      body: `${studentName} has booked a ${ctx.room.roomType} room at ${hostel.hostelName}.`,
      type: "booking",
    }),
  ]).catch((err) => console.error("Booking side effects error:", err));
}

export function fireTerminationSideEffects(ctx: BookingContext) {
  const studentName = studentFullName(ctx);
  const hostel = ctx.room.hostel;
  const landlord = ctx.room.hostel.landlord;

  Promise.allSettled([
    sendTerminationConfirmationEmail({
      to: ctx.student.studentEmail,
      studentName,
      hostelName: hostel.hostelName,
      roomType: ctx.room.roomType,
    }),
    sendTerminationNotificationToLandlord({
      to: landlord.email,
      landlordName: landlord.fullName,
      studentName,
      hostelName: hostel.hostelName,
      roomType: ctx.room.roomType,
    }),
    createNotification({
      userId: ctx.student.userId,
      title: "Booking Terminated",
      body: `Your booking at ${hostel.hostelName} has been terminated.`,
      type: "termination",
    }),
    createNotification({
      userId: landlord.userId,
      title: "Booking Terminated",
      body: `${studentName} has terminated their booking at ${hostel.hostelName}.`,
      type: "termination",
    }),
  ]).catch((err) => console.error("Termination side effects error:", err));
}

// ---------------------------------------------------------------------------
// Create booking
// ---------------------------------------------------------------------------

export async function createBooking(studentUserId: string, roomId: string) {
  const student = await requireStudent(studentUserId);

  const { booking } = await repo.createBookingTx(student.id, roomId);

  // Fetch context and fire side effects without blocking the response
  repo.findBookingContext(booking.id).then((ctx) => {
    if (ctx) fireBookingCreatedSideEffects(ctx);
  });

  return { booking };
}

// ---------------------------------------------------------------------------
// Terminate booking
// ---------------------------------------------------------------------------

export async function terminateBooking(
  studentUserId: string,
  bookingId: string
) {
  const student = await requireStudent(studentUserId);

  const { booking } = await repo.terminateBookingTx(bookingId, student.id);

  repo.findBookingContext(booking.id).then((ctx) => {
    if (ctx) fireTerminationSideEffects(ctx);
  });

  return { booking };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listBookings(studentUserId: string) {
  const student = await requireStudent(studentUserId);
  return repo.findBookingsByStudentId(student.id);
}

export async function getSingleBooking(
  studentUserId: string,
  bookingId: string
) {
  const student = await requireStudent(studentUserId);
  const result = await repo.findBookingByIdAndStudentId(bookingId, student.id);
  if (!result)
    throw Object.assign(new Error("Booking not found"), { status: 404 });
  return result;
}
