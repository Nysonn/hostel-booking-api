import {
  revokeClerkSession,
  updateClerkUserPassword,
} from "../../utils/clerk";
import { uploadMultiple } from "../../utils/cloudinary";
import type { CreateHostelInput, CreateRoomInput, UpdateRoomInput } from "./landlord.schema";
import * as repo from "./landlord.repository";
import { findBookingContext } from "../booking/booking.repository";
import { fireTerminationSideEffects } from "../booking/booking.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireLandlord(userId: string) {
  const landlord = await repo.findLandlordByUserId(userId);
  if (!landlord)
    throw Object.assign(new Error("Landlord profile not found"), {
      status: 404,
    });
  return landlord;
}

async function requireOwnedHostel(landlordId: string, hostelId: string) {
  const hostel = await repo.findHostelByIdAndLandlordId(hostelId, landlordId);
  if (!hostel)
    throw Object.assign(
      new Error("Hostel not found or does not belong to you"),
      { status: 404 }
    );
  return hostel;
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
// Hostels
// ---------------------------------------------------------------------------

export async function addHostel(
  landlordUserId: string,
  body: CreateHostelInput,
  files: Express.Multer.File[]
) {
  const landlord = await requireLandlord(landlordUserId);

  const imageUrls =
    files.length > 0
      ? await uploadMultiple(
          files.map((f) => f.buffer),
          "hostel-booking/hostel-images"
        )
      : [];

  return repo.createHostel(
    landlord.id,
    landlord.universityId,
    {
      hostelName: body.hostel_name,
      location: body.location,
      description: body.description,
      whatsappNumber: body.whatsapp_number,
    },
    imageUrls
  );
}

export async function listHostels(landlordUserId: string) {
  const landlord = await requireLandlord(landlordUserId);
  return repo.findHostelsByLandlordIdWithRooms(landlord.id);
}

export async function getHostel(landlordUserId: string, hostelId: string) {
  const landlord = await requireLandlord(landlordUserId);
  const hostel = await repo.findHostelByIdWithRooms(hostelId, landlord.id);
  if (!hostel)
    throw Object.assign(new Error("Hostel not found"), { status: 404 });
  return hostel;
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

export async function addRoom(
  landlordUserId: string,
  hostelId: string,
  body: CreateRoomInput
) {
  const landlord = await requireLandlord(landlordUserId);
  await requireOwnedHostel(landlord.id, hostelId);

  return repo.createRoom(hostelId, {
    roomType: body.room_type,
    price: body.price,
    capacity: body.capacity,
  });
}

export async function modifyRoom(
  landlordUserId: string,
  hostelId: string,
  roomId: string,
  body: UpdateRoomInput
) {
  const landlord = await requireLandlord(landlordUserId);
  await requireOwnedHostel(landlord.id, hostelId);

  const room = await repo.findRoomByIdAndHostelId(roomId, hostelId);
  if (!room)
    throw Object.assign(new Error("Room not found"), { status: 404 });

  return repo.updateRoomById(roomId, {
    roomType: body.room_type,
    price: body.price,
    capacity: body.capacity,
  });
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function terminateBooking(
  landlordUserId: string,
  hostelId: string,
  bookingId: string
) {
  const landlord = await requireLandlord(landlordUserId);

  const { booking } = await repo.terminateBookingByLandlordTx(
    bookingId,
    hostelId,
    landlord.id
  );

  findBookingContext(booking.id).then((ctx) => {
    if (ctx) fireTerminationSideEffects(ctx);
  });

  return { booking };
}

export async function listHostelBookings(landlordUserId: string, hostelId: string) {
  const landlord = await requireLandlord(landlordUserId);
  await requireOwnedHostel(landlord.id, hostelId);
  return repo.findBookingsByHostelId(hostelId);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function listNotifications(userId: string) {
  return repo.findNotificationsByUserId(userId);
}
