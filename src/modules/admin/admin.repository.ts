import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "../../db";
import {
  bookings,
  hostels,
  landlords,
  notifications,
  payments,
  rooms,
  students,
  universities,
  users,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function findAllNonAdminUsers(role?: string) {
  return db
    .select({
      user: users,
      university: universities,
      landlord: landlords,
      student: students,
    })
    .from(users)
    .leftJoin(universities, eq(users.id, universities.userId))
    .leftJoin(landlords, eq(users.id, landlords.userId))
    .leftJoin(students, eq(users.id, students.userId))
    .where(
      and(
        ne(users.role, "admin"),
        role
          ? eq(users.role, role as "university" | "landlord" | "student")
          : undefined
      )
    );
}

export function findAllUniversities() {
  return db
    .select({ university: universities, user: users })
    .from(universities)
    .leftJoin(users, eq(universities.userId, users.id));
}

export function findAllLandlords() {
  return db
    .select({ landlord: landlords, university: universities })
    .from(landlords)
    .leftJoin(universities, eq(landlords.universityId, universities.id));
}

export function findAllStudents() {
  return db
    .select({ student: students, university: universities })
    .from(students)
    .leftJoin(universities, eq(students.universityId, universities.id));
}

export async function findUserByInternalId(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateSuspension(userId: string, isSuspended: boolean) {
  await db
    .update(users)
    .set({ isSuspended, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function createUserAndUniversity(
  clerkId: string,
  data: {
    universityName: string;
    location: string;
    type: "government" | "private";
    email: string;
  }
) {
  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({ clerkId, role: "university" })
      .returning();

    const [newUniversity] = await tx
      .insert(universities)
      .values({
        userId: newUser.id,
        universityName: data.universityName,
        location: data.location,
        type: data.type,
        email: data.email,
      })
      .returning();

    return { user: newUser, university: newUniversity };
  });
}

export async function deleteUserCascade(
  userId: string,
  userRole: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // ── Student ──────────────────────────────────────────────────────────────
    if (userRole === "student") {
      const [student] = await tx
        .select({ id: students.id })
        .from(students)
        .where(eq(students.userId, userId));

      if (student) {
        await tx.delete(payments).where(eq(payments.studentId, student.id));
        await tx.delete(bookings).where(eq(bookings.studentId, student.id));
        await tx.delete(students).where(eq(students.id, student.id));
      }
    }

    // ── Landlord ─────────────────────────────────────────────────────────────
    if (userRole === "landlord") {
      const [landlord] = await tx
        .select({ id: landlords.id })
        .from(landlords)
        .where(eq(landlords.userId, userId));

      if (landlord) {
        const hostelList = await tx
          .select({ id: hostels.id })
          .from(hostels)
          .where(eq(hostels.landlordId, landlord.id));

        if (hostelList.length > 0) {
          const hostelIds = hostelList.map((h) => h.id);

          const roomList = await tx
            .select({ id: rooms.id })
            .from(rooms)
            .where(inArray(rooms.hostelId, hostelIds));

          if (roomList.length > 0) {
            const roomIds = roomList.map((r) => r.id);

            const bookingList = await tx
              .select({ id: bookings.id })
              .from(bookings)
              .where(inArray(bookings.roomId, roomIds));

            if (bookingList.length > 0) {
              const bookingIds = bookingList.map((b) => b.id);
              await tx
                .delete(payments)
                .where(inArray(payments.bookingId, bookingIds));
              await tx
                .delete(bookings)
                .where(inArray(bookings.id, bookingIds));
            }

            await tx.delete(rooms).where(inArray(rooms.id, roomIds));
          }

          await tx.delete(hostels).where(inArray(hostels.id, hostelIds));
        }

        await tx.delete(landlords).where(eq(landlords.id, landlord.id));
      }
    }

    // ── University ───────────────────────────────────────────────────────────
    if (userRole === "university") {
      const [univ] = await tx
        .select({ id: universities.id })
        .from(universities)
        .where(eq(universities.userId, userId));

      if (univ) {
        // Students belonging to this university
        const univStudents = await tx
          .select({ id: students.id, userId: students.userId })
          .from(students)
          .where(eq(students.universityId, univ.id));

        if (univStudents.length > 0) {
          const studentIds = univStudents.map((s) => s.id);
          const studentUserIds = univStudents.map((s) => s.userId);
          await tx
            .delete(payments)
            .where(inArray(payments.studentId, studentIds));
          await tx
            .delete(bookings)
            .where(inArray(bookings.studentId, studentIds));
          await tx
            .delete(notifications)
            .where(inArray(notifications.userId, studentUserIds));
          await tx.delete(students).where(inArray(students.id, studentIds));
          await tx.delete(users).where(inArray(users.id, studentUserIds));
        }

        // Landlords belonging to this university
        const univLandlords = await tx
          .select({ id: landlords.id, userId: landlords.userId })
          .from(landlords)
          .where(eq(landlords.universityId, univ.id));

        if (univLandlords.length > 0) {
          const landlordIds = univLandlords.map((l) => l.id);
          const landlordUserIds = univLandlords.map((l) => l.userId);

          const hostelList = await tx
            .select({ id: hostels.id })
            .from(hostels)
            .where(inArray(hostels.landlordId, landlordIds));

          if (hostelList.length > 0) {
            const hostelIds = hostelList.map((h) => h.id);

            const roomList = await tx
              .select({ id: rooms.id })
              .from(rooms)
              .where(inArray(rooms.hostelId, hostelIds));

            if (roomList.length > 0) {
              const roomIds = roomList.map((r) => r.id);

              const bookingList = await tx
                .select({ id: bookings.id })
                .from(bookings)
                .where(inArray(bookings.roomId, roomIds));

              if (bookingList.length > 0) {
                const bookingIds = bookingList.map((b) => b.id);
                await tx
                  .delete(payments)
                  .where(inArray(payments.bookingId, bookingIds));
                await tx
                  .delete(bookings)
                  .where(inArray(bookings.id, bookingIds));
              }

              await tx.delete(rooms).where(inArray(rooms.id, roomIds));
            }

            await tx.delete(hostels).where(inArray(hostels.id, hostelIds));
          }

          await tx
            .delete(notifications)
            .where(inArray(notifications.userId, landlordUserIds));
          await tx
            .delete(landlords)
            .where(inArray(landlords.id, landlordIds));
          await tx.delete(users).where(inArray(users.id, landlordUserIds));
        }

        await tx.delete(universities).where(eq(universities.id, univ.id));
      }
    }

    // Always delete the target user's notifications then the user itself
    await tx
      .delete(notifications)
      .where(eq(notifications.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
}
