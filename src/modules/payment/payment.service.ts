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

  Promise.allSettled([
    sendPaymentConfirmationEmail({
      to: ctx.student.studentEmail,
      studentName,
      amount: ctx.payment.amount,
      paymentType: ctx.payment.paymentType,
      paymentMethod: ctx.payment.paymentMethod,
    }),
    sendPaymentNotificationToLandlord({
      to: ctx.landlord.email,
      landlordName: ctx.landlord.fullName,
      studentName,
      amount: ctx.payment.amount,
      paymentType: ctx.payment.paymentType,
    }),
    createNotification({
      userId: ctx.student.userId,
      title: "Payment Successful",
      body: `Your ${ctx.payment.paymentType} payment of ${ctx.payment.amount} has been processed.`,
      type: "payment",
    }),
    createNotification({
      userId: ctx.landlord.userId,
      title: "Payment Received",
      body: `A ${ctx.payment.paymentType} payment has been received from ${studentName}.`,
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
  const bookingWithRoom = await repo.findBookingWithRoom(
    bookingId,
    student.id
  );
  if (!bookingWithRoom)
    throw Object.assign(new Error("Booking not found"), { status: 404 });

  if (bookingWithRoom.booking.status !== "active")
    throw Object.assign(new Error("Booking is not active"), { status: 400 });

  // Payment duplication checks
  const { hasPartial, hasFull } = await repo.findExistingPayments(bookingId);

  if (hasFull)
    throw Object.assign(new Error("Payment is already complete"), {
      status: 400,
    });

  if (hasPartial && body.payment_type === "partial")
    throw Object.assign(
      new Error("A partial payment has already been made for this booking"),
      { status: 400 }
    );

  // Calculate amount
  const roomPrice = parseFloat(bookingWithRoom.room.price);
  const rawAmount =
    body.payment_type === "partial" ? roomPrice * 0.5 : roomPrice;
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

export async function listPayments(
  studentUserId: string,
  bookingId: string
) {
  const student = await requireStudent(studentUserId);

  // Verify the booking belongs to this student
  const bookingWithRoom = await repo.findBookingWithRoom(
    bookingId,
    student.id
  );
  if (!bookingWithRoom)
    throw Object.assign(new Error("Booking not found"), { status: 404 });

  return repo.findPaymentsByBookingId(bookingId);
}
