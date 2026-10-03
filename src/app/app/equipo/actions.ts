"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

const roleSchema = z.enum(["admin", "member"]);
const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

const memberSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.email("Email no válido").trim().toLowerCase(),
  role: roleSchema,
  password: passwordSchema,
});

export type MemberInput = z.input<typeof memberSchema>;

function fail(error: unknown): ActionResult {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Datos no válidos" };
  if (error && typeof error === "object" && "message" in error) return { ok: false, error: String(error.message) };
  return { ok: false, error: "Ha ocurrido un error" };
}

// Comprueba que quien llama es admin y devuelve su empresa + el cliente de administración.
async function requireAdmin() {
  const { user, profile } = await getSession();
  if (profile?.role !== "admin") throw new Error("Solo un administrador puede gestionar el equipo");
  return { adminId: user.id, companyId: profile.company_id, admin: createAdminClient() };
}

// Comprueba que el usuario objetivo pertenece a la empresa del admin.
async function requireSameCompany(admin: ReturnType<typeof createAdminClient>, companyId: string, userId: string) {
  z.uuid().parse(userId);
  const { data } = await admin.from("profiles").select("id").eq("id", userId).eq("company_id", companyId).maybeSingle();
  if (!data) throw new Error("Ese usuario no pertenece a tu empresa");
}

export async function createMember(input: MemberInput): Promise<ActionResult> {
  try {
    const { companyId, admin } = await requireAdmin();
    const data = memberSchema.parse(input);

    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) {
      if (error.code === "email_exists" || /already/i.test(error.message)) {
        throw new Error("Ya existe un usuario con ese email");
      }
      throw error;
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      company_id: companyId,
      full_name: data.full_name,
      role: data.role,
    });
    if (profileError) {
      // Deshace el alta en Auth para no dejar un usuario sin empresa
      await admin.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    revalidatePath("/app/equipo");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMemberRole(userId: string, role: "admin" | "member"): Promise<ActionResult> {
  try {
    const { adminId, companyId, admin } = await requireAdmin();
    if (userId === adminId) throw new Error("No puedes cambiar tu propio rol");
    await requireSameCompany(admin, companyId, userId);

    const { error } = await admin.from("profiles").update({ role: roleSchema.parse(role) }).eq("id", userId);
    if (error) throw error;

    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resetMemberPassword(userId: string, password: string): Promise<ActionResult> {
  try {
    const { companyId, admin } = await requireAdmin();
    await requireSameCompany(admin, companyId, userId);

    const { error } = await admin.auth.admin.updateUserById(userId, { password: passwordSchema.parse(password) });
    if (error) throw error;

    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMember(userId: string): Promise<ActionResult> {
  try {
    const { adminId, companyId, admin } = await requireAdmin();
    if (userId === adminId) throw new Error("No puedes eliminar tu propio usuario");
    await requireSameCompany(admin, companyId, userId);

    // Borrar el usuario borra en cascada sus clientes y citas: se exige transferirlos antes.
    const { count, error: countError } = await admin
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    if (countError) throw countError;
    if (count) throw new Error(`Este usuario tiene ${count} cliente(s). Transfiérelos antes de eliminarlo.`);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    revalidatePath("/app/equipo");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
