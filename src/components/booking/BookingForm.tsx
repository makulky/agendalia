"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { bookAppointment, getAvailableSlots } from "@/app/reservar/[slug]/actions";

const DAYS_VISIBLE = 7;
const MAX_DAYS_AHEAD = 60;

// Fecha "yyyy-mm-dd" de hoy en la zona horaria de la empresa
function todayIn(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

// Suma días a una fecha "yyyy-mm-dd" sin depender de la zona horaria del navegador
function addDaysIso(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dayLabel(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}

export default function BookingForm({
  slug,
  professional,
  timezone,
}: {
  slug: string;
  professional: string;
  timezone: string;
}) {
  const today = useMemo(() => todayIn(timezone), [timezone]);
  const [offset, setOffset] = useState(0);
  const [day, setDay] = useState(today);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", reason: "", website: "" });
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: timezone }),
    [timezone],
  );
  const days = Array.from({ length: DAYS_VISIBLE }, (_, i) => addDaysIso(today, offset + i));

  const loadSlots = useCallback(
    async (d: string) => {
      setSlots(null);
      setSlot(null);
      setSlots(await getAvailableSlots(slug, d));
    },
    [slug],
  );

  // Carga inicial de las horas de hoy
  useEffect(() => {
    let cancelled = false;
    getAvailableSlots(slug, today).then((s) => !cancelled && setSlots(s));
    return () => {
      cancelled = true;
    };
  }, [slug, today]);

  function selectDay(d: string) {
    setDay(d);
    setError(null);
    loadSlots(d);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return setError("Elige una hora");
    setError(null);
    startTransition(async () => {
      const res = await bookAppointment({ slug, startsAt: slot, ...form });
      if (!res.ok) {
        setError(res.error);
        if (res.slotTaken) await loadSlots(day);
        return;
      }
      setBooked(slot);
    });
  }

  if (booked) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">¡Cita solicitada!</h2>
        <p className="mt-2 text-slate-600">
          <span className="capitalize">{dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}</span> a las{" "}
          <strong>{timeFormat.format(new Date(booked))}</strong>.
        </p>
        <p className="mt-1 text-sm text-slate-500">{professional} revisará tu solicitud y te la confirmará.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      {/* 1. Día */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">1. Elige el día</h2>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Días anteriores"
              className="btn-secondary px-3 py-1"
              disabled={offset === 0}
              onClick={() => setOffset(offset - DAYS_VISIBLE)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Días siguientes"
              className="btn-secondary px-3 py-1"
              disabled={offset + DAYS_VISIBLE > MAX_DAYS_AHEAD}
              onClick={() => setOffset(offset + DAYS_VISIBLE)}
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => selectDay(d)}
                className={`flex flex-col items-center rounded-lg py-2 text-sm ring-1 transition ${
                  active ? "bg-indigo-600 text-white ring-indigo-600" : "text-slate-700 ring-slate-200 hover:bg-indigo-50"
                }`}
              >
                <span className="text-xs uppercase opacity-80">{dayLabel(d, { weekday: "short" })}</span>
                <span className="text-lg font-semibold">{dayLabel(d, { day: "numeric" })}</span>
                <span className="text-[10px] opacity-80">{dayLabel(d, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Hora */}
      <section>
        <h2 className="mb-3 font-semibold text-slate-900">2. Elige la hora</h2>
        {slots === null ? (
          <p className="text-sm text-slate-500">Buscando horas libres…</p>
        ) : slots.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
            No quedan horas libres este día. Prueba con otro.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={`rounded-lg py-2 text-sm font-medium ring-1 transition ${
                  s === slot ? "bg-indigo-600 text-white ring-indigo-600" : "text-slate-700 ring-slate-200 hover:bg-indigo-50"
                }`}
              >
                {timeFormat.format(new Date(s))}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 3. Datos */}
      <section className="space-y-4">
        <h2 className="font-semibold text-slate-900">3. Tus datos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="b_name">Nombre y apellidos *</label>
            <input
              id="b_name"
              className="input"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="b_phone">Teléfono *</label>
            <input
              id="b_phone"
              type="tel"
              className="input"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="b_reason">Motivo de la cita</label>
          <input
            id="b_reason"
            className="input"
            maxLength={200}
            placeholder="Opcional"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        {/* Campo trampa antispam: oculto para personas */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={pending || !slot}>
        {pending
          ? "Reservando…"
          : slot
            ? `Reservar el ${dayLabel(day, { weekday: "long", day: "numeric" })} a las ${timeFormat.format(new Date(slot))}`
            : "Elige una hora para reservar"}
      </button>
    </form>
  );
}
