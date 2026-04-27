import { z } from "zod";

export const registerStudentSchema = z.object({
  registration_number: z.string().min(1),
  surname: z.string().min(1),
  other_names: z.string().min(1),
  gender: z.enum(["male", "female"]),
  student_email: z.string().email(),
  password: z.string().min(8),
  university_id: z.string().uuid("university_id must be a valid UUID"),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
