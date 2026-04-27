import { z } from "zod";

export const createBookingSchema = z.object({
  room_id: z.string().uuid("room_id must be a valid UUID"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
