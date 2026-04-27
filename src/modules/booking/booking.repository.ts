import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  bookings,
  hostels,
  landlords,
  rooms,
  students,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Student profile lookup
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
// Create booking — fully transactional
// ---------------------------------------------------------------------------

export async function createBookingTx(studentId: string, roomId: string) {
  return db.transaction(async (tx) => {
    // Lock room and re-validate availability inside transaction
    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);

    if (!room)
      throw Object.assign(new Error("Room not found"), { status: 404 });

    if (!room.isAvailable || room.occupiedSlots >= room.capacity)
      throw Object.assign(new Error("Room has no available slots"), {
        status: 400,
      });

    // Prevent double-booking
    const [existingBooking] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.studentId, studentId),
          eq(bookings.status, "active")
        )
      )
      .limit(1);

    if (existingBooking)
      throw Object.assign(
        new Error("You already have an active booking"),
        { status: 400 }
      );

    // Insert booking
    const [newBooking] = await tx
      .insert(bookings)
      .values({ studentId, roomId, status: "active" })
      .returning();

    // Update room occupancy
    const newOccupied = room.occupiedSlots + 1;
    const nowFull = newOccupied >= room.capacity;

    await tx
      .update(rooms)
      .set({
        occupiedSlots: newOccupied,
        ...(nowFull && { isAvailable: false }),
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, roomId));

    return { booking: newBooking };
  });
}

// ---------------------------------------------------------------------------
// Terminate booking — fully transactional
// ---------------------------------------------------------------------------

export async function terminateBookingTx(
  bookingId: string,
  studentId: string
) {
  return db.transaction(async (tx) => {
    // Validate ownership and status
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.id, bookingId), eq(bookings.studentId, studentId))
      )
      .limit(1);

    if (!booking)
      throw Object.assign(new Error("Booking not found"), { status: 404 });

    if (booking.status !== "active")
      throw Object.assign(new Error("Booking is not active"), { status: 400 });

    // Update booking status
    const [updatedBooking] = await tx
      .update(bookings)
      .set({ status: "terminated", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Read current room state inside transaction
    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.id, booking.roomId))
      .limit(1);

    const newOccupied = Math.max(0, room.occupiedSlots - 1);

    await tx
      .update(rooms)
      .set({
        occupiedSlots: newOccupied,
        // Restore availability only if the room was marked full
        ...(!room.isAvailable && { isAvailable: true }),
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, booking.roomId));

    return { booking: updatedBooking };
  });
}

// ---------------------------------------------------------------------------
// Booking context — used to gather all info needed for emails + notifications
// ---------------------------------------------------------------------------

export async function findBookingContext(bookingId: string) {
  const [result] = await db
    .select({
      booking: bookings,
      student: students,
      room: rooms,
      hostel: hostels,
      landlord: landlords,
    })
    .from(bookings)
    .innerJoin(students, eq(bookings.studentId, students.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
    .innerJoin(landlords, eq(hostels.landlordId, landlords.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// List / single — for GET endpoints
// ---------------------------------------------------------------------------

export function findBookingsByStudentId(studentId: string) {
  return db
    .select({ booking: bookings, room: rooms, hostel: hostels })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
    .where(eq(bookings.studentId, studentId))
    .orderBy(desc(bookings.createdAt));
}

export async function findBookingByIdAndStudentId(
  bookingId: string,
  studentId: string
) {
  const [result] = await db
    .select({ booking: bookings, room: rooms, hostel: hostels })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(hostels, eq(rooms.hostelId, hostels.id))
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.studentId, studentId))
    )
    .limit(1);
  return result ?? null;
}
