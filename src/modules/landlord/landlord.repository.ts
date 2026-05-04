import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Landlord profile
// ---------------------------------------------------------------------------

export async function findLandlordByUserId(userId: string) {
  return prisma.landlord.findUnique({ where: { userId } });
}

export async function findLandlordMeByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isSuspended: true,
      firstLogin: true,
      createdAt: true,
      updatedAt: true,
      landlord: {
        select: {
          id: true,
          universityId: true,
          fullName: true,
          gender: true,
          nin: true,
          maritalStatus: true,
          landlordCode: true,
          whatsappNumber: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function updateFirstLogin(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { firstLogin: false } });
}

// ---------------------------------------------------------------------------
// Hostels
// ---------------------------------------------------------------------------

export async function findHostelsByLandlordIdWithRooms(landlordId: string) {
  return prisma.hostel.findMany({
    where: { landlordId },
    include: { rooms: true },
  });
}

export async function findHostelByIdWithRooms(hostelId: string, landlordId: string) {
  return prisma.hostel.findFirst({
    where: { id: hostelId, landlordId },
    include: { rooms: true },
  });
}

export async function findHostelByIdAndLandlordId(hostelId: string, landlordId: string) {
  return prisma.hostel.findFirst({ where: { id: hostelId, landlordId } });
}

export async function createHostel(
  landlordId: string,
  universityId: string,
  data: {
    hostelName: string;
    location: string;
    description: string;
    whatsappNumber: string;
  },
  imageUrls: string[]
) {
  return prisma.hostel.create({
    data: {
      landlordId,
      universityId,
      hostelName: data.hostelName,
      location: data.location,
      description: data.description,
      images: imageUrls,
      whatsappNumber: data.whatsappNumber,
    },
  });
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function findRoomByIdAndHostelId(roomId: string, hostelId: string) {
  return prisma.room.findFirst({ where: { id: roomId, hostelId } });
}

export async function createRoom(
  hostelId: string,
  data: {
    roomType: "single_self_contained" | "double_self_contained";
    price: number;
    totalRooms: number;
    capacity: number;
  }
) {
  return prisma.room.upsert({
    where: { hostelId_roomType: { hostelId, roomType: data.roomType } },
    update: {
      price: data.price,
      totalRooms: data.totalRooms,
      capacity: data.capacity,
    },
    create: {
      hostelId,
      roomType: data.roomType,
      price: data.price,
      totalRooms: data.totalRooms,
      capacity: data.capacity,
    },
  });
}

export async function updateRoomById(
  roomId: string,
  data: {
    roomType?: "single_self_contained" | "double_self_contained";
    price?: number;
    totalRooms?: number;
    capacity?: number;
  }
) {
  return prisma.room.update({
    where: { id: roomId },
    data: {
      ...(data.roomType !== undefined && { roomType: data.roomType }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.totalRooms !== undefined && { totalRooms: data.totalRooms }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
    },
  });
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function terminateBookingByLandlordTx(
  bookingId: string,
  hostelId: string,
  landlordId: string
) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        room: { hostelId, hostel: { landlordId } },
      },
    });

    if (!booking)
      throw Object.assign(
        new Error("Booking not found or does not belong to your hostel"),
        { status: 404 }
      );

    if (booking.status !== "active")
      throw Object.assign(new Error("Booking is not active"), { status: 400 });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "terminated" },
    });

    const room = await tx.room.findUnique({ where: { id: booking.roomId } });
    if (room) {
      const newOccupied = Math.max(0, room.occupiedSlots - 1);
      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          occupiedSlots: newOccupied,
          ...(!room.isAvailable && { isAvailable: true }),
        },
      });
    }

    return { booking: updatedBooking };
  });
}

export async function findBookingsByHostelId(hostelId: string) {
  return prisma.booking.findMany({
    where: {
      room: { hostelId },
    },
    include: {
      student: {
        select: {
          id: true,
          registrationNumber: true,
          surname: true,
          otherNames: true,
          gender: true,
          studentEmail: true,
        },
      },
      room: {
        select: {
          id: true,
          roomType: true,
          price: true,
          capacity: true,
          occupiedSlots: true,
          isAvailable: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentType: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function findNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function countUnreadNotificationsByUserId(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAllNotificationsReadByUserId(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
