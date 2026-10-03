import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la service role key: se salta RLS y puede gestionar usuarios de Auth.
// SOLO en el servidor y siempre después de comprobar que quien llama es admin.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local (reinicia el servidor tras añadirla).");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const hasAdminKey = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;
