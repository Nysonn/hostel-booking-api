import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Booking + room (validates ownership, fetches price)
// ---------------------------------------------------------------------------

export async function findBookingWithRoom(bookingId: string, studentId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, studentId },
    include: { room: true },
  });
}

// ---------------------------------------------------------------------------
// Existing payment checks
// ---------------------------------------------------------------------------

export async function findExistingPayments(bookingId: string) {
  const existing = await prisma.payment.findMany({
    where: { bookingId, status: "success" },
    select: { paymentType: true },
  });

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
  return prisma.payment.create({
    data: {
      bookingId: data.bookingId,
      studentId: data.studentId,
      amount: data.amount,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      status: "success",
    },
  });
}

// ---------------------------------------------------------------------------
// Context for emails + notifications
// ---------------------------------------------------------------------------

export async function findPaymentContext(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: true,
      booking: {
        include: {
          room: {
            include: {
              hostel: {
                include: { landlord: true },
              },
            },
          },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// List payments for a booking
// ---------------------------------------------------------------------------

export function findPaymentsByBookingId(bookingId: string) {
  return prisma.payment.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}
