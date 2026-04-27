import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  hostels,
  landlords,
  notifications,
  rooms,
  users,
} from "../../db/schema";

// ---------------------------------------------------------------------------
// Landlord profile
// ---------------------------------------------------------------------------

export async function findLandlordByUserId(userId: string) {
  const [landlord] = await db
    .select()
    .from(landlords)
    .where(eq(landlords.userId, userId))
    .limit(1);
  return landlord ?? null;
}

export async function updateFirstLogin(userId: string) {
  await db
    .update(users)
    .set({ firstLogin: false, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Hostels
// ---------------------------------------------------------------------------

export async function findHostelsByLandlordIdWithRooms(landlordId: string) {
  const hostelList = await db
    .select()
    .from(hostels)
    .where(eq(hostels.landlordId, landlordId));

  if (!hostelList.length) return [];

  const roomList = await db
    .select()
    .from(rooms)
    .where(inArray(rooms.hostelId, hostelList.map((h) => h.id)));

  return hostelList.map((hostel) => ({
    ...hostel,
    rooms: roomList.filter((r) => r.hostelId === hostel.id),
  }));
}

export async function findHostelByIdWithRooms(
  hostelId: string,
  landlordId: string
) {
  const [hostel] = await db
    .select()
    .from(hostels)
    .where(and(eq(hostels.id, hostelId), eq(hostels.landlordId, landlordId)))
    .limit(1);

  if (!hostel) return null;

  const roomList = await db
    .select()
    .from(rooms)
    .where(eq(rooms.hostelId, hostelId));

  return { ...hostel, rooms: roomList };
}

export async function findHostelByIdAndLandlordId(
  hostelId: string,
  landlordId: string
) {
  const [hostel] = await db
    .select()
    .from(hostels)
    .where(and(eq(hostels.id, hostelId), eq(hostels.landlordId, landlordId)))
    .limit(1);
  return hostel ?? null;
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
  const [newHostel] = await db
    .insert(hostels)
    .values({
      landlordId,
      universityId,
      hostelName: data.hostelName,
      location: data.location,
      description: data.description,
      images: imageUrls,
      whatsappNumber: data.whatsappNumber,
    })
    .returning();
  return newHostel;
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function findRoomByIdAndHostelId(
  roomId: string,
  hostelId: string
) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.hostelId, hostelId)))
    .limit(1);
  return room ?? null;
}

export async function createRoom(
  hostelId: string,
  data: {
    roomType: "single_self_contained" | "double_self_contained";
    price: number;
    capacity: number;
  }
) {
  const [newRoom] = await db
    .insert(rooms)
    .values({
      hostelId,
      roomType: data.roomType,
      price: String(data.price),
      capacity: data.capacity,
    })
    .returning();
  return newRoom;
}

export async function updateRoomById(
  roomId: string,
  data: {
    roomType?: "single_self_contained" | "double_self_contained";
    price?: number;
    capacity?: number;
  }
) {
  const [updated] = await db
    .update(rooms)
    .set({
      ...(data.roomType !== undefined && { roomType: data.roomType }),
      ...(data.price !== undefined && { price: String(data.price) }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, roomId))
    .returning();
  return updated;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function findNotificationsByUserId(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}
