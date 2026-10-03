"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const clientSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  phone: optionalText,
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("Email no válido").nullable())
    .nullable()
    .optional(),
  notes: optionalText,
});

const appointmentSchema = z
  .object({
    client_id: z.uuid().optional(),
    new_client: clientSchema.optional(),
    starts_at: z.iso.datetime({ offset: true }),
    ends_at: z.iso.datetime({ offset: true }),
    reason: z.string().trim().min(1, "Indica el motivo de la cita"),
    notes: optionalText,
    status: z.enum(["pendiente", "confirmada", "cancelada", "completada"]),
  })
  .refine((a) => a.client_id || a.new_client, { message: "Selecciona o crea un cliente" })
  .refine((a) => new Date(a.ends_at) > new Date(a.starts_at), {
    message: "La hora de fin debe ser posterior a la de inicio",
  });

export type ClientInput = z.input<typeof clientSchema>;
export type AppointmentInput = z.input<typeof appointmentSchema>;

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Datos no válidos" };
  if (error && typeof error === "object" && "message" in error) return { ok: false, error: String(error.message) };
  return { ok: false, error: "Ha ocurrido un error" };
}

// ---------- Clientes ----------

export async function saveClient(id: string | null, input: ClientInput): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const data = clientSchema.parse(input);
    const { error } = id
      ? await supabase.from("clients").update(data).eq("id", id)
      : await supabase.from("clients").insert(data);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// Solo admin: la función SQL comprueba el rol y que el destino sea de la misma empresa.
export async function transferClients(clientIds: string[], toUserId: string): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const args = z
      .object({
        client_ids: z.array(z.uuid()).min(1, "Selecciona al menos un cliente"),
        to_user: z.uuid("Selecciona el usuario de destino"),
      })
      .parse({ client_ids: clientIds, to_user: toUserId });
    const { error } = await supabase.rpc("transfer_clients", args);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- Citas ----------

export async function saveAppointment(id: string | null, input: AppointmentInput): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const { new_client, client_id, ...fields } = appointmentSchema.parse(input);

    let clientId = client_id;
    if (!clientId && new_client) {
      const { data, error } = await supabase.from("clients").insert(new_client).select("id").single();
      if (error) throw error;
      clientId = data.id;
    }

    const row = { ...fields, client_id: clientId };
    const { error } = id
      ? await supabase.from("appointments").update(row).eq("id", id)
      : await supabase.from("appointments").insert(row);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function moveAppointment(id: string, starts_at: string, ends_at: string): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const times = z
      .object({ starts_at: z.iso.datetime({ offset: true }), ends_at: z.iso.datetime({ offset: true }) })
      .parse({ starts_at, ends_at });
    const { error } = await supabase.from("appointments").update(times).eq("id", id);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
