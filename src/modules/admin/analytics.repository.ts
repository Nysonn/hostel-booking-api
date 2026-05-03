import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

export async function fetchOverviewCounts() {
  const [
    totalUniversities,
    totalLandlords,
    totalStudents,
    totalHostels,
    totalRooms,
    totalActiveBookings,
    totalTerminatedBookings,
    suspendedUsers,
  ] = await Promise.all([
    prisma.university.count(),
    prisma.landlord.count(),
    prisma.student.count(),
    prisma.hostel.count(),
    prisma.room.count(),
    prisma.booking.count({ where: { status: "active" } }),
    prisma.booking.count({ where: { status: "terminated" } }),
    prisma.user.count({ where: { isSuspended: true, role: { not: "admin" } } }),
  ]);

  const occupiedSlots = await prisma.room.aggregate({ _sum: { occupiedSlots: true } });
  const totalCapacity = await prisma.room.aggregate({ _sum: { capacity: true } });

  return {
    totalUniversities,
    totalLandlords,
    totalStudents,
    totalHostels,
    totalRooms,
    totalActiveBookings,
    totalTerminatedBookings,
    suspendedUsers,
    totalOccupiedSlots: occupiedSlots._sum.occupiedSlots ?? 0,
    totalCapacity: totalCapacity._sum.capacity ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export async function fetchRevenueStats() {
  const [totalRevenue, successPayments, failedPayments, byMethod, byType] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "success" },
      }),
      prisma.payment.count({ where: { status: "success" } }),
      prisma.payment.count({ where: { status: "failed" } }),
      prisma.payment.groupBy({
        by: ["paymentMethod"],
        where: { status: "success" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.groupBy({
        by: ["paymentType"],
        where: { status: "success" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

  return {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    successfulPayments: successPayments,
    failedPayments,
    byMethod: byMethod.map((r) => ({
      method: r.paymentMethod,
      count: r._count.id,
      total: r._sum.amount ?? 0,
    })),
    byType: byType.map((r) => ({
      type: r.paymentType,
      count: r._count.id,
      total: r._sum.amount ?? 0,
    })),
  };
}

// ---------------------------------------------------------------------------
// Per-university breakdown
// ---------------------------------------------------------------------------

export async function fetchUniversityBreakdown() {
  const universities = await prisma.university.findMany({
    select: {
      id: true,
      universityName: true,
      type: true,
      _count: {
        select: {
          landlords: true,
          students: true,
          hostels: true,
        },
      },
    },
  });

  // Fetch room totals per university in one query
  const roomsPerUniversity = await prisma.room.groupBy({
    by: ["hostelId"],
    _sum: { capacity: true, occupiedSlots: true },
    _count: { id: true },
  });

  // Map hostelId → universityId
  const hostels = await prisma.hostel.findMany({
    select: { id: true, universityId: true },
  });
  const hostelUnivMap = new Map(hostels.map((h) => [h.id, h.universityId]));

  const univRoomMap = new Map<
    string,
    { totalRooms: number; totalCapacity: number; occupiedSlots: number }
  >();

  for (const row of roomsPerUniversity) {
    const univId = hostelUnivMap.get(row.hostelId);
    if (!univId) continue;
    const existing = univRoomMap.get(univId) ?? {
      totalRooms: 0,
      totalCapacity: 0,
      occupiedSlots: 0,
    };
    univRoomMap.set(univId, {
      totalRooms: existing.totalRooms + row._count.id,
      totalCapacity: existing.totalCapacity + (row._sum.capacity ?? 0),
      occupiedSlots: existing.occupiedSlots + (row._sum.occupiedSlots ?? 0),
    });
  }

  return universities.map((u) => {
    const rooms = univRoomMap.get(u.id) ?? {
      totalRooms: 0,
      totalCapacity: 0,
      occupiedSlots: 0,
    };
    return {
      universityId: u.id,
      universityName: u.universityName,
      type: u.type,
      landlordCount: u._count.landlords,
      studentCount: u._count.students,
      hostelCount: u._count.hostels,
      ...rooms,
      occupancyRate:
        rooms.totalCapacity > 0
          ? Number(
              ((rooms.occupiedSlots / rooms.totalCapacity) * 100).toFixed(2)
            )
          : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Recent registrations (last 30 days)
// ---------------------------------------------------------------------------

export async function fetchRecentRegistrations() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [newStudents, newLandlords, newUniversities] = await Promise.all([
    prisma.student.count({ where: { createdAt: { gte: since } } }),
    prisma.landlord.count({ where: { createdAt: { gte: since } } }),
    prisma.university.count({ where: { createdAt: { gte: since } } }),
  ]);

  return { newStudents, newLandlords, newUniversities, windowDays: 30 };
}
