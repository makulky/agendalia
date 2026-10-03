import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import type { Client } from "@/lib/types";
import AgendaCalendar from "@/components/calendar/AgendaCalendar";

export const metadata: Metadata = { title: "Agenda · Agendalia" };

export default async function AgendaPage() {
  const { supabase } = await getSession();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, notes")
    .order("full_name");

  return <AgendaCalendar clients={(clients ?? []) as Client[]} />;
}
