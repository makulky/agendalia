"use client";

import { useState, useTransition } from "react";
import { addMinutes, format } from "date-fns";
import { APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus, type Client } from "@/lib/types";
import { deleteAppointment, saveAppointment, type ClientInput } from "@/app/app/actions";
import ClientFields from "@/components/clients/ClientFields";
import ClientCombobox from "@/components/clients/ClientCombobox";

export type AppointmentDraft =
  | { kind: "new"; start: Date; end: Date }
  | { kind: "edit"; appointment: Appointment };

const toIso = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();

export default function AppointmentForm({
  draft,
  clients,
  onDone,
  onCancel,
}: {
  draft: AppointmentDraft;
  clients: Client[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const existing = draft.kind === "edit" ? draft.appointment : null;
  const start = existing ? new Date(existing.starts_at) : (draft as { start: Date }).start;
  const end = existing ? new Date(existing.ends_at) : (draft as { end: Date }).end;

  const [clientMode, setClientMode] = useState<"existing" | "new">(clients.length === 0 ? "new" : "existing");
  const [clientId, setClientId] = useState(existing?.client_id ?? "");
  const [newClient, setNewClient] = useState<ClientInput>({ full_name: "", phone: "", email: "" });
  const [date, setDate] = useState(format(start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(format(start, "HH:mm"));
  const [endTime, setEndTime] = useState(format(end, "HH:mm"));
  const [reason, setReason] = useState(existing?.reason ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(existing?.status ?? "pendiente");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onStartTimeChange(value: string) {
    // Mantiene la duración al cambiar la hora de inicio
    const duration = new Date(`${date}T${endTime}`).getTime() - new Date(`${date}T${startTime}`).getTime();
    setStartTime(value);
    if (value && duration > 0) {
      setEndTime(format(addMinutes(new Date(`${date}T${value}`), duration / 60000), "HH:mm"));
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (clientMode === "existing" && !clientId) return setError("Selecciona un cliente");

    startTransition(async () => {
      const res = await saveAppointment(existing?.id ?? null, {
        client_id: clientMode === "existing" ? clientId : undefined,
        new_client: clientMode === "new" ? newClient : undefined,
        starts_at: toIso(date, startTime),
        ends_at: toIso(date, endTime),
        reason,
        notes,
        status,
      });
      if (!res.ok) return setError(res.error);
      onDone();
    });
  }

  function onDelete() {
    if (!existing || !confirm("¿Eliminar esta cita?")) return;
    startTransition(async () => {
      const res = await deleteAppointment(existing.id);
      if (!res.ok) return setError(res.error);
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset className="space-y-3">
        <div className="flex items-center justify-between">
          <legend className="label mb-0">Cliente *</legend>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            {(["existing", "new"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setClientMode(mode)}
                className={`rounded-md px-3 py-1 ${clientMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                {mode === "existing" ? "Existente" : "Nuevo cliente"}
              </button>
            ))}
          </div>
        </div>

        {clientMode === "existing" ? (
          <ClientCombobox
            clients={clients}
            value={clientId}
            onChange={setClientId}
            onCreateNew={(full_name) => {
              setNewClient({ ...newClient, full_name });
              setClientMode("new");
            }}
          />
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <ClientFields value={newClient} onChange={setNewClient} showNotes={false} />
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="date">Día *</label>
          <input id="date" type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="start">Desde *</label>
          <input id="start" type="time" step={300} className="input" required value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="end">Hasta *</label>
          <input id="end" type="time" step={300} className="input" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="reason">Motivo *</label>
        <input id="reason" className="input" required placeholder="Ej.: Primera consulta, revisión…" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">Notas</label>
          <textarea id="notes" rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="status">Estado</label>
          <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center justify-between">
        {existing ? (
          <button type="button" className="btn-danger" onClick={onDelete} disabled={pending}>Eliminar</button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar cita"}</button>
        </div>
      </div>
    </form>
  );
}
