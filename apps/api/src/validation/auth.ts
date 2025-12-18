import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Password is required").max(1_000),
});

export type LoginInput = z.infer<typeof loginSchema>;

