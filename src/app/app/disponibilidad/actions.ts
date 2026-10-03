"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora no válida");

const settingsSchema = z
  .object({
    booking_enabled: z.boolean(),
    booking_slug: z
      .string()
      .trim()
      .toLowerCase()
      .transform((v) => (v === "" ? null : v))
      .pipe(
        z
          .string()
          .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "El enlace solo puede tener letras, números y guiones")
          .min(3, "El enlace debe tener al menos 3 caracteres")
          .max(50, "El enlace es demasiado largo")
          .nullable(),
      ),
    slot_minutes: z.number().int().min(5).max(240),
    availability: z.array(
      z
        .object({ weekday: z.number().int().min(1).max(7), start_time: time, end_time: time })
        .refine((a) => a.end_time > a.start_time, { message: "En cada franja, «hasta» debe ser posterior a «desde»" }),
    ),
  })
  .refine((s) => !s.booking_enabled || s.booking_slug, {
    message: "Elige tu enlace de reservas para activarlas",
  })
  .refine((s) => !s.booking_enabled || s.availability.length > 0, {
    message: "Añade al menos una franja horaria para activar las reservas",
  });

export type BookingSettingsInput = z.input<typeof settingsSchema>;

export async function saveBookingSettings(input: BookingSettingsInput): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  try {
    const { availability, ...profile } = settingsSchema.parse(input);

    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    if (error) {
      if (error.code === "23505") throw new Error("Ese enlace ya está en uso, elige otro");
      throw error;
    }

    // Reemplaza el horario semanal completo
    const { error: delError } = await supabase.from("availability").delete().eq("owner_id", user.id);
    if (delError) throw delError;
    if (availability.length > 0) {
      const { error: insError } = await supabase.from("availability").insert(availability);
      if (insError) throw insError;
    }

    revalidatePath("/app/disponibilidad");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Datos no válidos" };
    return { ok: false, error: e instanceof Error ? e.message : String((e as { message?: string })?.message ?? "Error") };
  }
}
