import dotenv from "dotenv";
dotenv.config();

import { createClerkClient } from "@clerk/express";
import { prisma } from "./index";

const ADMIN_EMAIL = "info@hostelbooking.com";
const ADMIN_PASSWORD = "Agumya2026!@nyson";

async function seed() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  // --- Clerk ---
  const existing = await clerk.users.getUserList({
    emailAddress: [ADMIN_EMAIL],
  });

  let clerkId: string;

  if (existing.data.length > 0) {
    clerkId = existing.data[0].id;
    console.log(`Clerk admin already exists: ${clerkId}`);
  } else {
    const clerkUser = await clerk.users.createUser({
      emailAddress: [ADMIN_EMAIL],
      password: ADMIN_PASSWORD,
      publicMetadata: { role: "admin" },
    });
    clerkId = clerkUser.id;
    console.log(`Created Clerk admin: ${clerkId}`);
  }

  // --- Local DB ---
  const existingDbUser = await prisma.user.findUnique({ where: { clerkId } });

  if (existingDbUser) {
    console.log("DB admin already exists — nothing to do.");
  } else {
    await prisma.user.create({ data: { clerkId, role: "admin" } });
    console.log("Created DB admin record.");
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
