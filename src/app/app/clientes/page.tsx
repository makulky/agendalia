import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import type { Client } from "@/lib/types";
import ClientsTable from "@/components/clients/ClientsTable";

export const metadata: Metadata = { title: "Clientes · Agendalia" };

export default async function ClientesPage() {
  const { supabase } = await getSession();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, notes")
    .order("full_name");

  return <ClientsTable clients={(clients ?? []) as Client[]} />;
}
