import { prisma } from "../../db";

// ---------------------------------------------------------------------------
// Landlord profile
// ---------------------------------------------------------------------------

export async function findLandlordByUserId(userId: string) {
  return prisma.landlord.findUnique({ where: { userId } });
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
    capacity: number;
  }
) {
  return prisma.room.create({
    data: {
      hostelId,
      roomType: data.roomType,
      price: data.price,
      capacity: data.capacity,
    },
  });
}

export async function updateRoomById(
  roomId: string,
  data: {
    roomType?: "single_self_contained" | "double_self_contained";
    price?: number;
    capacity?: number;
  }
) {
  return prisma.room.update({
    where: { id: roomId },
    data: {
      ...(data.roomType !== undefined && { roomType: data.roomType }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
    },
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
