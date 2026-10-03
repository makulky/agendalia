"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toWhatsAppNumber, whatsAppLink } from "@/lib/whatsapp";

type Reminder = {
  id: string;
  starts_at: string;
  reason: string;
  status: string;
  clients: { full_name: string; phone: string | null } | null;
};

export default function TomorrowReminders({ companyName }: { companyName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  // "Mañana" según la zona horaria del navegador del usuario
  const tomorrow = useMemo(() => addDays(startOfDay(new Date()), 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // RLS: solo llegan las citas del usuario autenticado
      const { data, error } = await supabase
        .from("appointments")
        .select("id, starts_at, reason, status, clients!appointments_client_owner_fkey(full_name, phone)")
        .gte("starts_at", tomorrow.toISOString())
        .lt("starts_at", addDays(tomorrow, 1).toISOString())
        .neq("status", "cancelada")
        .order("starts_at");
      if (cancelled) return;
      if (error) {
        console.error("Error cargando recordatorios:", error);
        setError("No se pudieron cargar las citas de mañana.");
        return;
      }
      setReminders(data as unknown as Reminder[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, tomorrow]);

  function message(r: Reminder) {
    const time = format(new Date(r.starts_at), "HH:mm");
    const reason = r.reason.trim().replace(/\.+$/, "");
    return (
      `Hola! ${r.clients?.full_name ?? ""}, tienes cita mañana a las ${time} en ${companyName}.` +
      (reason ? ` Motivo: ${reason}.` : "")
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recordatorios para mañana</h1>
        <p className="text-sm capitalize text-slate-500">{format(tomorrow, "EEEE d 'de' MMMM", { locale: es })}</p>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {reminders === null && !error && <p className="px-4 py-10 text-center text-sm text-slate-500">Cargando…</p>}

        {reminders?.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No tienes citas para mañana.</p>
        )}

        {reminders && reminders.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {reminders.map((r) => {
              const number = toWhatsAppNumber(r.clients?.phone ?? null);
              const isSent = sent.has(r.id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="w-12 font-mono text-lg font-semibold text-indigo-600">
                      {format(new Date(r.starts_at), "HH:mm")}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{r.clients?.full_name ?? "Cliente"}</p>
                      <p className="text-sm text-slate-500">
                        {[r.clients?.phone, r.reason].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>

                  {number ? (
                    <a
                      href={whatsAppLink(number, message(r))}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSent(new Set(sent).add(r.id))}
                      className={
                        isSent
                          ? "btn-secondary"
                          : "inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-500"
                      }
                    >
                      {isSent ? "✓ Enviar de nuevo" : "Enviar"}
                    </a>
                  ) : (
                    <span className="text-sm text-amber-700" title="Añade un teléfono válido en la ficha del cliente">
                      Sin teléfono válido
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Al pulsar «Enviar» se abre WhatsApp con el mensaje preparado; el envío lo confirmas tú en WhatsApp.
        Los teléfonos sin prefijo se consideran españoles (+34).
      </p>
    </div>
  );
}
