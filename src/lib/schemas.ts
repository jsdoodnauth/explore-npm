import { z } from "zod";

// ── User / profile ─────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(80, "Name must be 80 characters or fewer")
    .trim()
    .optional(),
  image: z
    .union([
      z.string().url("Image must be a valid URL").max(2048).startsWith("https://"),
      z.null(),
    ])
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

// ── Helpers ────────────────────────────────────────────────────────────────

export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((e: { message: string }) => e.message).join("; ");
    return {
      success: false,
      response: Response.json({ error: message }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}

export function parseBodyNext<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: import("next/server").NextResponse } {
  const { NextResponse } = require("next/server") as typeof import("next/server");
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((e: { message: string }) => e.message).join("; ");
    return {
      success: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}
