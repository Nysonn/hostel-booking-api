import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Student profile lookup
// ---------------------------------------------------------------------------

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Create booking — fully transactional
// ---------------------------------------------------------------------------

export async function createBookingTx(studentId: string, roomId: string) {
  return prisma.$transaction(async (tx) => {
    // Lock room and re-validate availability inside transaction
    const room = await tx.room.findUnique({ where: { id: roomId } });

    if (!room)
      throw Object.assign(new Error("Room not found"), { status: 404 });

    if (!room.isAvailable || room.occupiedSlots >= room.totalRooms * room.capacity)
      throw Object.assign(new Error("Room has no available slots"), { status: 400 });

    // Prevent double-booking
    const existingBooking = await tx.booking.findFirst({
      where: { studentId, status: "active" },
    });

    if (existingBooking)
      throw Object.assign(new Error("You already have an active booking. Students can only book at one hostel at a time."), { status: 400 });

    // Insert booking
    const newBooking = await tx.booking.create({
      data: { studentId, roomId, status: "active" },
    });

    // Update room occupancy
    const newOccupied = room.occupiedSlots + 1;
    const nowFull = newOccupied >= room.totalRooms * room.capacity;

    await tx.room.update({
      where: { id: roomId },
      data: {
        occupiedSlots: newOccupied,
        ...(nowFull && { isAvailable: false }),
      },
    });

    return { booking: newBooking };
  });
}

// ---------------------------------------------------------------------------
// Terminate booking — fully transactional
// ---------------------------------------------------------------------------

export async function terminateBookingTx(bookingId: string, studentId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, studentId },
    });

    if (!booking)
      throw Object.assign(new Error("Booking not found"), { status: 404 });

    if (booking.status !== "active")
      throw Object.assign(new Error("Booking is not active"), { status: 400 });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "terminated" },
    });

    const room = await tx.room.findUnique({ where: { id: booking.roomId } });
    if (room) {
      const newOccupied = Math.max(0, room.occupiedSlots - 1);
      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          occupiedSlots: newOccupied,
          ...(!room.isAvailable && { isAvailable: true }),
        },
      });
    }

    return { booking: updatedBooking };
  });
}

// ---------------------------------------------------------------------------
// Booking context — used to gather all info needed for emails + notifications
// ---------------------------------------------------------------------------

export async function findBookingContext(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      room: {
        include: {
          hostel: {
            include: { landlord: true },
          },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// List / single — for GET endpoints
// ---------------------------------------------------------------------------

export function findBookingsByStudentId(studentId: string) {
  return prisma.booking.findMany({
    where: { studentId },
    include: { room: { include: { hostel: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findBookingByIdAndStudentId(bookingId: string, studentId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, studentId },
    include: { room: { include: { hostel: true } } },
  });
}
