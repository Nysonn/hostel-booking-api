import { z } from "zod";

export const resetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createLandlordSchema = z.object({
  full_name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  nin: z.string().min(1),
  marital_status: z.string().min(1),
  whatsapp_number: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateLandlordInput = z.infer<typeof createLandlordSchema>;
