import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const cardSchema = z.object({
  cardName: z.string().min(1),
  totalSlots: z.number().int().min(30),
  rewardMap: z.record(z.string(), z.string()).default({}),
});
