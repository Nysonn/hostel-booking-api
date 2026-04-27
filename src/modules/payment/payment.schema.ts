import { z } from "zod";

export const createPaymentSchema = z.object({
  payment_method: z.enum(["mtn_mobile_money", "airtel_mobile_money"]),
  payment_type: z.enum(["partial", "full"]),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
