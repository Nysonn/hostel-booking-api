import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function findAllNonAdminUsers(role?: string) {
  return prisma.user.findMany({
    where: {
      role: role
        ? { equals: role as "university" | "landlord" | "student" }
        : { not: "admin" },
    },
    include: {
      university: true,
      landlord: true,
      student: true,
    },
  });
}

export function findAllUniversities() {
  return prisma.university.findMany({ include: { user: true } });
}

export function findAllLandlords() {
  return prisma.landlord.findMany({ include: { university: true } });
}

export function findAllStudents() {
  return prisma.student.findMany({ include: { university: true } });
}

export async function findUserByInternalId(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function findAdminByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkId: true,
      role: true,
      isSuspended: true,
      firstLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findAdminByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      role: true,
      isSuspended: true,
      firstLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateSuspension(userId: string, isSuspended: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { isSuspended } });
}

export async function createUserAndUniversity(
  clerkId: string,
  data: {
    universityName: string;
    location: string;
    type: "government" | "private";
    email: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { clerkId, role: "university" },
    });

    const newUniversity = await tx.university.create({
      data: {
        userId: newUser.id,
        universityName: data.universityName,
        location: data.location,
        type: data.type,
        email: data.email,
      },
    });

    return { user: newUser, university: newUniversity };
  });
}

export async function deleteUserCascade(
  userId: string,
  userRole: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // ── Student ──────────────────────────────────────────────────────────────
    if (userRole === "student") {
      const student = await tx.student.findUnique({ where: { userId } });

      if (student) {
        await tx.payment.deleteMany({ where: { studentId: student.id } });
        await tx.booking.deleteMany({ where: { studentId: student.id } });
        await tx.student.delete({ where: { id: student.id } });
      }
    }

    // ── Landlord ─────────────────────────────────────────────────────────────
    if (userRole === "landlord") {
      const landlord = await tx.landlord.findUnique({ where: { userId } });

      if (landlord) {
        const hostelIds = (
          await tx.hostel.findMany({
            where: { landlordId: landlord.id },
            select: { id: true },
          })
        ).map((h) => h.id);

        if (hostelIds.length > 0) {
          const roomIds = (
            await tx.room.findMany({
              where: { hostelId: { in: hostelIds } },
              select: { id: true },
            })
          ).map((r) => r.id);

          if (roomIds.length > 0) {
            const bookingIds = (
              await tx.booking.findMany({
                where: { roomId: { in: roomIds } },
                select: { id: true },
              })
            ).map((b) => b.id);

            if (bookingIds.length > 0) {
              await tx.payment.deleteMany({
                where: { bookingId: { in: bookingIds } },
              });
              await tx.booking.deleteMany({
                where: { id: { in: bookingIds } },
              });
            }

            await tx.room.deleteMany({ where: { id: { in: roomIds } } });
          }

          await tx.hostel.deleteMany({ where: { id: { in: hostelIds } } });
        }

        await tx.landlord.delete({ where: { id: landlord.id } });
      }
    }

    // ── University ───────────────────────────────────────────────────────────
    if (userRole === "university") {
      const univ = await tx.university.findUnique({ where: { userId } });

      if (univ) {
        // Students belonging to this university
        const univStudents = await tx.student.findMany({
          where: { universityId: univ.id },
          select: { id: true, userId: true },
        });

        if (univStudents.length > 0) {
          const studentIds = univStudents.map((s) => s.id);
          const studentUserIds = univStudents.map((s) => s.userId);

          await tx.payment.deleteMany({ where: { studentId: { in: studentIds } } });
          await tx.booking.deleteMany({ where: { studentId: { in: studentIds } } });
          await tx.notification.deleteMany({ where: { userId: { in: studentUserIds } } });
          await tx.student.deleteMany({ where: { id: { in: studentIds } } });
          await tx.user.deleteMany({ where: { id: { in: studentUserIds } } });
        }

        // Landlords belonging to this university
        const univLandlords = await tx.landlord.findMany({
          where: { universityId: univ.id },
          select: { id: true, userId: true },
        });

        if (univLandlords.length > 0) {
          const landlordIds = univLandlords.map((l) => l.id);
          const landlordUserIds = univLandlords.map((l) => l.userId);

          const hostelIds = (
            await tx.hostel.findMany({
              where: { landlordId: { in: landlordIds } },
              select: { id: true },
            })
          ).map((h) => h.id);

          if (hostelIds.length > 0) {
            const roomIds = (
              await tx.room.findMany({
                where: { hostelId: { in: hostelIds } },
                select: { id: true },
              })
            ).map((r) => r.id);

            if (roomIds.length > 0) {
              const bookingIds = (
                await tx.booking.findMany({
                  where: { roomId: { in: roomIds } },
                  select: { id: true },
                })
              ).map((b) => b.id);

              if (bookingIds.length > 0) {
                await tx.payment.deleteMany({
                  where: { bookingId: { in: bookingIds } },
                });
                await tx.booking.deleteMany({
                  where: { id: { in: bookingIds } },
                });
              }

              await tx.room.deleteMany({ where: { id: { in: roomIds } } });
            }

            await tx.hostel.deleteMany({ where: { id: { in: hostelIds } } });
          }

          await tx.notification.deleteMany({
            where: { userId: { in: landlordUserIds } },
          });
          await tx.landlord.deleteMany({ where: { id: { in: landlordIds } } });
          await tx.user.deleteMany({ where: { id: { in: landlordUserIds } } });
        }

        await tx.university.delete({ where: { id: univ.id } });
      }
    }

    // Always delete the target user's notifications then the user itself
    await tx.notification.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
