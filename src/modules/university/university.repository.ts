import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findUniversityByUserId(userId: string) {
  return prisma.university.findUnique({ where: { userId } });
}

export function findLandlordsByUniversityId(universityId: string) {
  return prisma.landlord.findMany({ where: { universityId } });
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
  },
  documentUrls: string[]
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
        ownershipDocuments: documentUrls,
        landlordCode: data.landlordCode,
        whatsappNumber: data.whatsappNumber,
        email: data.email,
      },
    });

    return { user: newUser, landlord: newLandlord };
  });
}
