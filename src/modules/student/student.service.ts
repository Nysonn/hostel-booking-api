import {
  createClerkUser,
  deleteClerkUser,
  revokeClerkSession,
} from "../../utils/clerk";
import type { RegisterStudentInput } from "./student.schema";
import * as repo from "./student.repository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireStudent(userId: string) {
  const student = await repo.findStudentByUserId(userId);
  if (!student)
    throw Object.assign(new Error("Student profile not found"), { status: 404 });
  return student;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function register(body: RegisterStudentInput) {
  const university = await repo.findUniversityById(body.university_id);
  if (!university)
    throw Object.assign(new Error("University not found"), { status: 404 });

  const existingByRegNum = await repo.findStudentByRegistrationNumber(
    body.registration_number
  );
  if (existingByRegNum)
    throw Object.assign(
      new Error("Registration number is already in use"),
      { status: 409 }
    );

  const existingByEmail = await repo.findStudentByEmail(body.student_email);
  if (existingByEmail)
    throw Object.assign(new Error("Email is already registered"), {
      status: 409,
    });

  const clerkUser = await createClerkUser({
    email: body.student_email,
    password: body.password,
    role: "student",
  });

  try {
    return await repo.createUserAndStudent(clerkUser.id, body);
  } catch (err) {
    await deleteClerkUser(clerkUser.id).catch(() => {});
    throw err;
  }
}

export async function logout(sessionId: string) {
  await revokeClerkSession(sessionId);
}

// ---------------------------------------------------------------------------
// Universities (public)
// ---------------------------------------------------------------------------

export function listUniversities() {
  return repo.findAllUniversitiesPublic();
}

// ---------------------------------------------------------------------------
// Hostels
// ---------------------------------------------------------------------------

export async function listHostels(studentUserId: string) {
  const student = await requireStudent(studentUserId);
  return repo.findHostelsByUniversityIdWithRooms(student.universityId);
}

export async function getHostel(studentUserId: string, hostelId: string) {
  const student = await requireStudent(studentUserId);
  const hostel = await repo.findHostelByIdAndUniversityIdWithRooms(
    hostelId,
    student.universityId
  );
  if (!hostel)
    throw Object.assign(new Error("Hostel not found"), { status: 404 });
  return hostel;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function listNotifications(userId: string) {
  return repo.findNotificationsByUserId(userId);
}
