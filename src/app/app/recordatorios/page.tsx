import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import TomorrowReminders from "@/components/reminders/TomorrowReminders";

export const metadata: Metadata = { title: "Recordatorios · Agendalia" };

export default async function RecordatoriosPage() {
  const { profile } = await getSession();
  return <TomorrowReminders companyName={profile?.companies?.name ?? ""} />;
}
