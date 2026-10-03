"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBookingSettings } from "@/app/app/disponibilidad/actions";

export type Slot = { weekday: number; start_time: string; end_time: string };

type Settings = {
  booking_enabled: boolean;
  booking_slug: string;
  slot_minutes: number;
  availability: Slot[];
};

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120];

const noopSubscribe = () => () => {};

// "María López" -> "maria-lopez"
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function AvailabilitySettings({ fullName, initial }: { fullName: string; initial: Settings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(() => ({
    ...initial,
    booking_slug: initial.booking_slug || slugify(fullName),
  }));
  // window solo existe en el navegador; en el servidor se pinta vacío
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const link = `${origin}/reservar/${settings.booking_slug}`;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  function updateSlot(index: number, patch: Partial<Slot>) {
    set("availability", settings.availability.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlot(weekday: number) {
    const sameDay = settings.availability.filter((s) => s.weekday === weekday);
    const last = sameDay[sameDay.length - 1];
    // Primera franja 9-14; las siguientes, por la tarde
    const slot = last ? { weekday, start_time: "16:00", end_time: "20:00" } : { weekday, start_time: "09:00", end_time: "14:00" };
    set("availability", [...settings.availability, slot]);
  }

  function removeSlot(index: number) {
    set("availability", settings.availability.filter((_, i) => i !== index));
  }

  function copyToOtherWeekdays(weekday: number) {
    const source = settings.availability.filter((s) => s.weekday === weekday);
    const others = [1, 2, 3, 4, 5].filter((d) => d !== weekday);
    set("availability", [
      ...settings.availability.filter((s) => !others.includes(s.weekday)),
      ...others.flatMap((d) => source.map((s) => ({ ...s, weekday: d }))),
    ]);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveBookingSettings(settings);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "Disponibilidad guardada." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disponibilidad</h1>
        <p className="text-sm text-slate-500">
          Define tu horario y comparte tu enlace: tus clientes podrán reservar en los huecos libres.
        </p>
      </div>

      <section className="space-y-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-indigo-600"
            checked={settings.booking_enabled}
            onChange={(e) => set("booking_enabled", e.target.checked)}
          />
          <span className="font-medium text-slate-900">Reservas online activas</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label" htmlFor="slug">Tu enlace de reservas</label>
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 text-sm focus-within:border-indigo-500">
              <span className="truncate pl-3 text-slate-500">{origin}/reservar/</span>
              <input
                id="slug"
                className="min-w-0 flex-1 rounded-r-lg bg-white px-2 py-2 outline-none"
                value={settings.booking_slug}
                onChange={(e) => set("booking_slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="duration">Duración de cada cita</label>
            <select
              id="duration"
              className="input"
              value={settings.slot_minutes}
              onChange={(e) => set("slot_minutes", Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
        </div>

        {initial.booking_enabled && initial.booking_slug && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm">
            <a href={`/reservar/${initial.booking_slug}`} target="_blank" className="font-medium text-indigo-700 underline">
              {origin}/reservar/{initial.booking_slug}
            </a>
            <button type="button" className="btn-secondary px-3 py-1" onClick={copyLink}>
              {copied ? "✓ Copiado" : "Copiar enlace"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Horario semanal</h2>
        <ul className="divide-y divide-slate-100">
          {WEEKDAYS.map((label, i) => {
            const weekday = i + 1;
            const daySlots = settings.availability
              .map((s, index) => ({ ...s, index }))
              .filter((s) => s.weekday === weekday);
            return (
              <li key={weekday} className="flex flex-wrap items-start gap-3 py-3">
                <span className="w-24 pt-2 font-medium text-slate-700">{label}</span>
                <div className="flex flex-1 flex-col gap-2">
                  {daySlots.length === 0 && <span className="pt-2 text-sm text-slate-400">No disponible</span>}
                  {daySlots.map((s) => (
                    <div key={s.index} className="flex items-center gap-2">
                      <input
                        type="time"
                        step={300}
                        className="input w-32"
                        value={s.start_time}
                        onChange={(e) => updateSlot(s.index, { start_time: e.target.value })}
                      />
                      <span className="text-slate-400">–</span>
                      <input
                        type="time"
                        step={300}
                        className="input w-32"
                        value={s.end_time}
                        onChange={(e) => updateSlot(s.index, { end_time: e.target.value })}
                      />
                      <button
                        type="button"
                        aria-label="Quitar franja"
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        onClick={() => removeSlot(s.index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-1" onClick={() => addSlot(weekday)}>
                    + Franja
                  </button>
                  {weekday <= 5 && daySlots.length > 0 && (
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1"
                      title="Copiar este horario al resto de días laborables"
                      onClick={() => copyToOtherWeekdays(weekday)}
                    >
                      Copiar a L‑V
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {message && (
        <p className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={onSave} disabled={pending}>
          {pending ? "Guardando…" : "Guardar disponibilidad"}
        </button>
      </div>
    </div>
  );
}
