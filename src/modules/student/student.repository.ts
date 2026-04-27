import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  hostels,
  notifications,
  rooms,
  students,
  universities,
  users,
} from "../../db/schema";
import type { RegisterStudentInput } from "./student.schema";

// ---------------------------------------------------------------------------
// Universities (for public listing + registration validation)
// ---------------------------------------------------------------------------

export function findAllUniversitiesPublic() {
  return db
    .select({ id: universities.id, universityName: universities.universityName })
    .from(universities);
}

export async function findUniversityById(universityId: string) {
  const [univ] = await db
    .select()
    .from(universities)
    .where(eq(universities.id, universityId))
    .limit(1);
  return univ ?? null;
}

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

export async function findStudentByRegistrationNumber(
  registrationNumber: string
) {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.registrationNumber, registrationNumber))
    .limit(1);
  return student ?? null;
}

export async function findStudentByEmail(email: string) {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.studentEmail, email))
    .limit(1);
  return student ?? null;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function createUserAndStudent(
  clerkId: string,
  data: RegisterStudentInput
) {
  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        clerkId,
        role: "student",
        firstLogin: false,
      })
      .returning();

    const [newStudent] = await tx
      .insert(students)
      .values({
        userId: newUser.id,
        universityId: data.university_id,
        registrationNumber: data.registration_number,
        surname: data.surname,
        otherNames: data.other_names,
        gender: data.gender,
        studentEmail: data.student_email,
      })
      .returning();

    return { user: newUser, student: newStudent };
  });
}

// ---------------------------------------------------------------------------
// Hostels (scoped to student's university)
// ---------------------------------------------------------------------------

export async function findHostelsByUniversityIdWithRooms(
  universityId: string
) {
  const hostelList = await db
    .select()
    .from(hostels)
    .where(eq(hostels.universityId, universityId));

  if (!hostelList.length) return [];

  const roomList = await db
    .select()
    .from(rooms)
    .where(inArray(rooms.hostelId, hostelList.map((h) => h.id)));

  return hostelList.map((hostel) => ({
    ...hostel,
    rooms: roomList
      .filter((r) => r.hostelId === hostel.id)
      .map((r) => ({
        ...r,
        available_slots: r.capacity - r.occupiedSlots,
      })),
  }));
}

export async function findHostelByIdAndUniversityIdWithRooms(
  hostelId: string,
  universityId: string
) {
  const [hostel] = await db
    .select()
    .from(hostels)
    .where(
      and(
        eq(hostels.id, hostelId),
        eq(hostels.universityId, universityId)
      )
    )
    .limit(1);

  if (!hostel) return null;

  const roomList = await db
    .select()
    .from(rooms)
    .where(eq(rooms.hostelId, hostelId));

  return {
    ...hostel,
    rooms: roomList.map((r) => ({
      ...r,
      available_slots: r.capacity - r.occupiedSlots,
    })),
  };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function findNotificationsByUserId(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}
