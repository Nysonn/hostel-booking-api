import { prisma } from "../../db";
import type { RegisterStudentInput } from "./student.schema";

// ---------------------------------------------------------------------------
// Universities (for public listing + registration validation)
// ---------------------------------------------------------------------------

export function findAllUniversitiesPublic() {
  return prisma.university.findMany({ select: { id: true, universityName: true } });
}

export async function findUniversityById(universityId: string) {
  return prisma.university.findUnique({ where: { id: universityId } });
}

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export async function findStudentByUserId(userId: string) {
  return prisma.student.findUnique({ where: { userId } });
}

export async function findStudentMeByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isSuspended: true,
      firstLogin: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          universityId: true,
          registrationNumber: true,
          surname: true,
          otherNames: true,
          gender: true,
          studentEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function findStudentByRegistrationNumber(registrationNumber: string) {
  return prisma.student.findUnique({
    where: { registrationNumber },
    select: { id: true },
  });
}

export async function findStudentByEmail(email: string) {
  return prisma.student.findUnique({
    where: { studentEmail: email },
    select: { id: true },
  });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function createUserAndStudent(clerkId: string, data: RegisterStudentInput) {
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { clerkId, role: "student", firstLogin: false },
    });

    const newStudent = await tx.student.create({
      data: {
        userId: newUser.id,
        universityId: data.university_id,
        registrationNumber: data.registration_number,
        surname: data.surname,
        otherNames: data.other_names,
        gender: data.gender,
        studentEmail: data.student_email,
      },
    });

    return { user: newUser, student: newStudent };
  });
}

// ---------------------------------------------------------------------------
// Hostels (scoped to student's university)
// ---------------------------------------------------------------------------

export async function findHostelsByUniversityIdWithRooms(universityId: string) {
  const hostels = await prisma.hostel.findMany({
    where: { universityId },
    include: { rooms: true },
  });

  return hostels.map((hostel) => ({
    ...hostel,
    rooms: hostel.rooms.map((r) => ({
      ...r,
      available_slots: r.totalRooms * r.capacity - r.occupiedSlots,
    })),
  }));
}

export async function findHostelByIdAndUniversityIdWithRooms(
  hostelId: string,
  universityId: string
) {
  const hostel = await prisma.hostel.findFirst({
    where: { id: hostelId, universityId },
    include: { rooms: true },
  });

  if (!hostel) return null;

  return {
    ...hostel,
    rooms: hostel.rooms.map((r) => ({
      ...r,
      available_slots: r.totalRooms * r.capacity - r.occupiedSlots,
    })),
  };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function findNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function countUnreadNotificationsByUserId(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAllNotificationsReadByUserId(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
