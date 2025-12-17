import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  FILEVAULT_ADMIN_EMAIL: z.email(),
  FILEVAULT_ADMIN_PASSWORD: z
    .string()
    .min(12, "Administrator password must have at least 12 characters"),
  SESSION_SECRET: z
    .string()
    .min(32, "Session secret must have at least 32 characters"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(
  input: NodeJS.ProcessEnv = process.env,
): Environment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    throw new Error(`Environment variables are not valid: ${problems}`);
  }

  return result.data;
}
