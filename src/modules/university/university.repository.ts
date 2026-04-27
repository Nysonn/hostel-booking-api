import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  hostels,
  landlords,
  students,
  universities,
  users,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function findUniversityByUserId(userId: string) {
  const [univ] = await db
    .select()
    .from(universities)
    .where(eq(universities.userId, userId))
    .limit(1);
  return univ ?? null;
}

export function findLandlordsByUniversityId(universityId: string) {
  return db
    .select()
    .from(landlords)
    .where(eq(landlords.universityId, universityId));
}

export function findStudentsByUniversityId(universityId: string) {
  return db
    .select()
    .from(students)
    .where(eq(students.universityId, universityId));
}

export function findHostelsByUniversityId(universityId: string) {
  return db
    .select()
    .from(hostels)
    .where(eq(hostels.universityId, universityId));
}

export async function isLandlordCodeUnique(code: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: landlords.id })
    .from(landlords)
    .where(eq(landlords.landlordCode, code))
    .limit(1);
  return !existing;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateFirstLogin(userId: string) {
  await db
    .update(users)
    .set({ firstLogin: false, updatedAt: new Date() })
    .where(eq(users.id, userId));
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
  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({ clerkId, role: "landlord" })
      .returning();

    const [newLandlord] = await tx
      .insert(landlords)
      .values({
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
      })
      .returning();

    return { user: newUser, landlord: newLandlord };
  });
}
