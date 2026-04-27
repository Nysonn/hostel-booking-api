import {
  createClerkUser,
  deleteClerkUser,
  revokeClerkSession,
  updateClerkUserPassword,
} from "../../utils/clerk";
import { sendLandlordRegistrationEmail } from "../../utils/email";
import { uploadMultiple } from "../../utils/cloudinary";
import type { CreateLandlordInput } from "./university.schema";
import * as repo from "./university.repository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateUniqueLandlordCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    if (await repo.isLandlordCodeUnique(code)) return code;
  }
}

async function requireUniversity(userId: string) {
  const university = await repo.findUniversityByUserId(userId);
  if (!university)
    throw Object.assign(new Error("University profile not found"), {
      status: 404,
    });
  return university;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function resetPassword(
  clerkId: string,
  userId: string,
  newPassword: string
) {
  await updateClerkUserPassword(clerkId, newPassword);
  await repo.updateFirstLogin(userId);
}

export async function logout(sessionId: string) {
  await revokeClerkSession(sessionId);
}

// ---------------------------------------------------------------------------
// Landlords
// ---------------------------------------------------------------------------

export async function registerLandlord(
  universityUserId: string,
  body: CreateLandlordInput,
  files: Express.Multer.File[]
) {
  const university = await requireUniversity(universityUserId);

  const documentUrls =
    files.length > 0
      ? await uploadMultiple(
          files.map((f) => f.buffer),
          "hostel-booking/ownership-docs"
        )
      : [];

  const landlordCode = await generateUniqueLandlordCode();

  const clerkUser = await createClerkUser({
    email: body.email,
    password: body.password,
    role: "landlord",
  });

  try {
    const result = await repo.createUserAndLandlord(
      clerkUser.id,
      university.id,
      {
        fullName: body.full_name,
        gender: body.gender,
        nin: body.nin,
        maritalStatus: body.marital_status,
        landlordCode,
        whatsappNumber: body.whatsapp_number,
        email: body.email,
      },
      documentUrls
    );

    sendLandlordRegistrationEmail({
      to: body.email,
      fullName: body.full_name,
      landlordCode,
      temporaryPassword: body.password,
    }).catch((err) => console.error("Landlord registration email failed:", err));

    return result;
  } catch (err) {
    await deleteClerkUser(clerkUser.id).catch(() => {});
    throw err;
  }
}

export async function listLandlords(universityUserId: string) {
  const university = await requireUniversity(universityUserId);
  return repo.findLandlordsByUniversityId(university.id);
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function listStudents(universityUserId: string) {
  const university = await requireUniversity(universityUserId);
  return repo.findStudentsByUniversityId(university.id);
}

// ---------------------------------------------------------------------------
// Hostels
// ---------------------------------------------------------------------------

export async function listHostels(universityUserId: string) {
  const university = await requireUniversity(universityUserId);
  return repo.findHostelsByUniversityId(university.id);
}
