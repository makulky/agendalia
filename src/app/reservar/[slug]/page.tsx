import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/booking/BookingForm";

type BookingPage = { professional: string; company: string; slot_minutes: number; timezone: string };

const getBookingPage = cache(async (slug: string): Promise<BookingPage | null> => {
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_booking_page", { p_slug: slug });
  return (data as BookingPage[] | null)?.[0] ?? null;
});

export async function generateMetadata({ params }: PageProps<"/reservar/[slug]">): Promise<Metadata> {
  const page = await getBookingPage((await params).slug);
  return { title: page ? `Reserva con ${page.professional} · ${page.company}` : "Reserva no disponible · Agendalia" };
}

export default async function ReservarPage({ params }: PageProps<"/reservar/[slug]">) {
  const { slug } = await params;
  const page = await getBookingPage(slug);
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          <p className="text-sm font-medium text-indigo-600">{page.company}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Reserva tu cita con {page.professional}</h1>
          <p className="mt-2 text-sm text-slate-500">Citas de {page.slot_minutes} minutos · Elige un día y una hora libre</p>
        </header>

        <BookingForm slug={slug} professional={page.professional} timezone={page.timezone} />

        <p className="text-center text-xs text-slate-400">
          Reservas gestionadas con <Link href="/" className="font-medium text-indigo-500 hover:underline">Agendalia</Link>
        </p>
      </div>
    </main>
  );
}
