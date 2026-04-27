import { z } from "zod";

export const resetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createHostelSchema = z.object({
  hostel_name: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  whatsapp_number: z.string().min(1),
});

export const createRoomSchema = z.object({
  room_type: z.enum(["single_self_contained", "double_self_contained"]),
  price: z.number().positive("Price must be a positive number"),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
});

export const updateRoomSchema = z.object({
  room_type: z
    .enum(["single_self_contained", "double_self_contained"])
    .optional(),
  price: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
});

export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
