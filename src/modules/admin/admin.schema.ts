import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const getUsersQuerySchema = z.object({
  role: z.enum(["university", "landlord", "student"]).optional(),
});

export const createUniversitySchema = z.object({
  university_name: z.string().min(1),
  location: z.string().min(1),
  type: z.enum(["government", "private"]),
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUniversityInput = z.infer<typeof createUniversitySchema>;
