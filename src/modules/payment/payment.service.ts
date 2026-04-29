import {
  sendPaymentConfirmationEmail,
  sendPaymentNotificationToLandlord,
} from "../../utils/email";
import { createNotification } from "../../utils/notification";
import type { CreatePaymentInput } from "./payment.schema";
import * as repo from "./payment.repository";

// ---------------------------------------------------------------------------
// Dummy payment processor — always succeeds
// ---------------------------------------------------------------------------

async function processPayment(_amount: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PaymentContext = NonNullable<
  Awaited<ReturnType<typeof repo.findPaymentContext>>
>;

async function requireStudent(userId: string) {
  const student = await repo.findStudentByUserId(userId);
  if (!student)
    throw Object.assign(new Error("Student profile not found"), { status: 404 });
  return student;
}

function firePaymentSideEffects(ctx: PaymentContext) {
  const studentName = `${ctx.student.surname} ${ctx.student.otherNames}`;
  const landlord = ctx.booking.room.hostel.landlord;

  Promise.allSettled([
    sendPaymentConfirmationEmail({
      to: ctx.student.studentEmail,
      studentName,
      amount: ctx.amount.toString(),
      paymentType: ctx.paymentType,
      paymentMethod: ctx.paymentMethod,
    }),
    sendPaymentNotificationToLandlord({
      to: landlord.email,
      landlordName: landlord.fullName,
      studentName,
      amount: ctx.amount.toString(),
      paymentType: ctx.paymentType,
    }),
    createNotification({
      userId: ctx.student.userId,
      title: "Payment Successful",
      body: `Your ${ctx.paymentType} payment of ${ctx.amount.toString()} has been processed.`,
      type: "payment",
    }),
    createNotification({
      userId: landlord.userId,
      title: "Payment Received",
      body: `A ${ctx.paymentType} payment has been received from ${studentName}.`,
      type: "payment",
    }),
  ]).catch((err) => console.error("Payment side effects error:", err));
}

// ---------------------------------------------------------------------------
// Process payment
// ---------------------------------------------------------------------------

export async function processBookingPayment(
  studentUserId: string,
  bookingId: string,
  body: CreatePaymentInput
) {
  const student = await requireStudent(studentUserId);

  // Validate booking ownership and fetch room price
  const bookingWithRoom = await repo.findBookingWithRoom(bookingId, student.id);
  if (!bookingWithRoom)
    throw Object.assign(new Error("Booking not found"), { status: 404 });

  if (bookingWithRoom.status !== "active")
    throw Object.assign(new Error("Booking is not active"), { status: 400 });

  // Payment duplication checks
  const { hasPartial, hasFull } = await repo.findExistingPayments(bookingId);

  if (hasFull)
    throw Object.assign(new Error("Payment is already complete"), { status: 400 });

  if (hasPartial && body.payment_type === "partial")
    throw Object.assign(
      new Error("A partial payment has already been made for this booking"),
      { status: 400 }
    );

  // Calculate amount
  const roomPrice = bookingWithRoom.room.price.toNumber();
  const rawAmount = body.payment_type === "partial" ? roomPrice * 0.5 : roomPrice;
  const amount = parseFloat(rawAmount.toFixed(2));

  // Dummy payment gateway (always succeeds)
  await processPayment(amount);

  // Persist payment record
  const payment = await repo.createPayment({
    bookingId,
    studentId: student.id,
    amount,
    paymentType: body.payment_type,
    paymentMethod: body.payment_method,
  });

  // Non-blocking side effects
  repo.findPaymentContext(payment.id).then((ctx) => {
    if (ctx) firePaymentSideEffects(ctx);
  });

  return { payment };
}

// ---------------------------------------------------------------------------
// List payments for a booking
// ---------------------------------------------------------------------------

export async function listPayments(studentUserId: string, bookingId: string) {
  const student = await requireStudent(studentUserId);

  const bookingWithRoom = await repo.findBookingWithRoom(bookingId, student.id);
  if (!bookingWithRoom)
    throw Object.assign(new Error("Booking not found"), { status: 404 });

  return repo.findPaymentsByBookingId(bookingId);
}
