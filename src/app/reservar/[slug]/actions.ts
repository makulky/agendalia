"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Acciones públicas (sin login). Toda la validación de negocio vive en las
// funciones SQL security definer: aquí solo se filtran entradas mal formadas.

const slugSchema = z.string().regex(/^[a-z0-9-]{3,50}$/);

export async function getAvailableSlots(slug: string, day: string): Promise<string[]> {
  const args = z
    .object({ p_slug: slugSchema, p_day: z.iso.date() })
    .safeParse({ p_slug: slug, p_day: day });
  if (!args.success) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", args.data);
  if (error) {
    console.error("Error cargando huecos:", error);
    return [];
  }
  return (data ?? []) as string[];
}

export type BookingResult = { ok: true } | { ok: false; error: string; slotTaken?: boolean };

export async function bookAppointment(input: {
  slug: string;
  startsAt: string;
  fullName: string;
  phone: string;
  reason: string;
  website: string; // campo trampa: los humanos no lo ven ni lo rellenan
}): Promise<BookingResult> {
  if (input.website) return { ok: true };

  const parsed = z
    .object({
      p_slug: slugSchema,
      p_starts_at: z.iso.datetime({ offset: true }),
      p_full_name: z.string().trim().min(2, "Indica tu nombre").max(100),
      p_phone: z.string().trim().min(9, "Indica un teléfono válido").max(30),
      p_reason: z.string().trim().max(200),
    })
    .safeParse({
      p_slug: input.slug,
      p_starts_at: input.startsAt,
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_reason: input.reason,
    });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_appointment", parsed.data);
  if (error) {
    return { ok: false, error: error.message, slotTaken: error.hint === "slot_taken" };
  }
  return { ok: true };
}
