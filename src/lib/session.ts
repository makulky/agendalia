import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Usuario autenticado + su perfil y empresa. Redirige a /login si no hay sesión.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (!auth.user) {
    if (error) console.warn("Sesión no válida:", error.message);
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name, role, companies(name)")
    .eq("id", auth.user.id)
    .single();

  return {
    supabase,
    user: auth.user,
    profile: profile as {
      company_id: string;
      full_name: string;
      role: string;
      companies: { name: string } | null;
    } | null,
  };
});
