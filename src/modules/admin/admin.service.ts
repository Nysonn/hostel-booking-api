import {
  createClerkUser,
  deleteClerkUser,
  findClerkUserByEmail,
  getClerkUserById,
  suspendClerkUser,
  unsuspendClerkUser,
  verifyClerkPassword,
} from "../../utils/clerk";
import { sendUniversityWelcomeEmail } from "../../utils/email";
import type { AdminLoginInput, CreateUniversityInput } from "./admin.schema";
import * as repo from "./admin.repository";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAdmin(input: AdminLoginInput) {
  const clerkUser = await findClerkUserByEmail(input.email);
  if (!clerkUser) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const verified = await verifyClerkPassword(clerkUser.id, input.password);
  if (!verified.verified) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const user = await repo.findAdminByClerkId(clerkUser.id);
  if (!user || user.role !== "admin") {
    throw Object.assign(new Error("Access denied: not an admin account"), { status: 403 });
  }

  if (user.isSuspended) {
    throw Object.assign(new Error("Account is suspended"), { status: 403 });
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    role: user.role,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? input.email,
    firstLogin: user.firstLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getMe(userId: string) {
  const user = await repo.findAdminByUserId(userId);
  if (!user) throw Object.assign(new Error("Admin user not found"), { status: 404 });
  const clerkUser = await getClerkUserById(user.clerkId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  return { ...user, email };
}

export async function getUsersList(role?: string) {
  const rows = await repo.findAllNonAdminUsers(role);
  return rows.map(({ university, landlord, student, ...user }) => ({
    ...user,
    profile: university ?? landlord ?? student ?? null,
  }));
}

export function getUniversitiesList() {
  return repo.findAllUniversities();
}

export function getLandlordsList() {
  return repo.findAllLandlords();
}

export function getStudentsList() {
  return repo.findAllStudents();
}

// ---------------------------------------------------------------------------
// Suspend / unsuspend
// ---------------------------------------------------------------------------

export async function suspendUser(userId: string) {
  const user = await repo.findUserByInternalId(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.role === "admin")
    throw Object.assign(new Error("Cannot suspend the admin"), { status: 403 });

  await Promise.all([
    repo.updateSuspension(userId, true),
    suspendClerkUser(user.clerkId),
  ]);
}

export async function unsuspendUser(userId: string) {
  const user = await repo.findUserByInternalId(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.role === "admin")
    throw Object.assign(new Error("Cannot unsuspend the admin"), { status: 403 });

  await Promise.all([
    repo.updateSuspension(userId, false),
    unsuspendClerkUser(user.clerkId),
  ]);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function removeUser(userId: string) {
  const user = await repo.findUserByInternalId(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.role === "admin")
    throw Object.assign(new Error("Cannot delete the admin account"), {
      status: 403,
    });

  await repo.deleteUserCascade(userId, user.role);
  await deleteClerkUser(user.clerkId);
}

// ---------------------------------------------------------------------------
// Create university
// ---------------------------------------------------------------------------

export async function addUniversity(body: CreateUniversityInput) {
  // Create Clerk user first (external — must precede DB writes)
  const clerkUser = await createClerkUser({
    email: body.email,
    password: body.password,
    role: "university",
  });

  try {
    const result = await repo.createUserAndUniversity(clerkUser.id, {
      universityName: body.university_name,
      location: body.location,
      type: body.type,
      email: body.email,
    });

    // Email failure must not rollback a successful account creation
    sendUniversityWelcomeEmail({
      to: body.email,
      universityName: body.university_name,
      temporaryPassword: body.password,
    }).catch((err) => console.error("Welcome email failed:", err));

    return result;
  } catch (err) {
    // DB failed — attempt to clean up the orphaned Clerk user
    await deleteClerkUser(clerkUser.id).catch(() => {});
    throw err;
  }
}
