import { createClerkClient } from "@clerk/express";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function createClerkUser(params: {
  email: string;
  password: string;
  role: "admin" | "university" | "landlord" | "student";
}) {
  return clerk.users.createUser({
    emailAddress: [params.email],
    password: params.password,
    publicMetadata: { role: params.role },
  });
}

export async function suspendClerkUser(clerkId: string) {
  return clerk.users.banUser(clerkId);
}

export async function unsuspendClerkUser(clerkId: string) {
  return clerk.users.unbanUser(clerkId);
}

export async function deleteClerkUser(clerkId: string) {
  return clerk.users.deleteUser(clerkId);
}

export async function updateClerkUserMetadata(
  clerkId: string,
  publicMetadata: Record<string, unknown>
) {
  return clerk.users.updateUserMetadata(clerkId, { publicMetadata });
}

export async function updateClerkUserPassword(clerkId: string, password: string) {
  return clerk.users.updateUser(clerkId, { password });
}

export async function revokeClerkSession(sessionId: string) {
  return clerk.sessions.revokeSession(sessionId);
}
