import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findUniversityByUserId(userId: string) {
  return prisma.university.findUnique({ where: { userId } });
}

export async function findUniversityMeByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isSuspended: true,
      firstLogin: true,
      createdAt: true,
      updatedAt: true,
      university: {
        select: {
          id: true,
          universityName: true,
          location: true,
          type: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          landlords: {
            select: {
              id: true,
              fullName: true,
              hostels: {
                select: {
                  _count: { select: { rooms: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export function findLandlordsByUniversityId(universityId: string) {
  return prisma.landlord.findMany({ where: { universityId } });
}

export async function findLandlordByUserIdAndUniversityId(
  landlordUserId: string,
  universityId: string
) {
  return prisma.landlord.findFirst({
    where: { userId: landlordUserId, universityId },
    include: { user: { select: { id: true, clerkId: true, isSuspended: true } } },
  });
}

export function findStudentsByUniversityId(universityId: string) {
  return prisma.student.findMany({ where: { universityId } });
}

export function findHostelsByUniversityId(universityId: string) {
  return prisma.hostel.findMany({ where: { universityId } });
}

export async function isLandlordCodeUnique(code: string): Promise<boolean> {
  const existing = await prisma.landlord.findUnique({
    where: { landlordCode: code },
    select: { id: true },
  });
  return !existing;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateFirstLogin(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { firstLogin: false } });
}

export async function updateSuspension(userId: string, isSuspended: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { isSuspended } });
}

export async function createUserAndLandlord(
  clerkId: string,
  universityId: string,
  data: {
    fullName: string;
    gender: "male" | "female";
    nin: string;
    maritalStatus: string;
    landlordCode: string;
    whatsappNumber: string;
    email: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { clerkId, role: "landlord" },
    });

    const newLandlord = await tx.landlord.create({
      data: {
        userId: newUser.id,
        universityId,
        fullName: data.fullName,
        gender: data.gender,
        nin: data.nin,
        maritalStatus: data.maritalStatus,
        landlordCode: data.landlordCode,
        whatsappNumber: data.whatsappNumber,
        email: data.email,
      },
    });

    return { user: newUser, landlord: newLandlord };
  });
}
