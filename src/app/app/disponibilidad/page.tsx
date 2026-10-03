import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import AvailabilitySettings, { type Slot } from "@/components/booking/AvailabilitySettings";

export const metadata: Metadata = { title: "Disponibilidad · Agendalia" };

export default async function DisponibilidadPage() {
  const { supabase, user, profile } = await getSession();

  const [{ data: settings, error }, { data: slots }] = await Promise.all([
    supabase.from("profiles").select("booking_enabled, booking_slug, slot_minutes").eq("id", user.id).single(),
    supabase.from("availability").select("weekday, start_time, end_time").order("weekday").order("start_time"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 ring-1 ring-red-200">
        No se pudo cargar tu disponibilidad. ¿Has ejecutado la migración 0004?
      </div>
    );
  }

  return (
    <AvailabilitySettings
      fullName={profile?.full_name ?? ""}
      initial={{
        booking_enabled: settings.booking_enabled,
        booking_slug: settings.booking_slug ?? "",
        slot_minutes: settings.slot_minutes,
        availability: ((slots ?? []) as Slot[]).map((s) => ({
          ...s,
          // Postgres devuelve "09:00:00"; los <input type="time"> usan "09:00"
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
        })),
      }}
    />
  );
}
