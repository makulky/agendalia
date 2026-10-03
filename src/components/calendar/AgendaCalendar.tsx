"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMinutes, setHours } from "date-fns";
import FullCalendar, {
  type CalendarRef,
  type DateSelectInfo,
  type EventChangeInfo,
  type EventClickInfo,
  type EventSourceFuncInfo,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import esLocale from "@fullcalendar/react/locales/es";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import { createClient } from "@/lib/supabase/client";
import { APPOINTMENT_STATUSES, type Appointment, type Client } from "@/lib/types";
import { moveAppointment } from "@/app/app/actions";
import Modal from "@/components/Modal";
import AppointmentForm, { type AppointmentDraft } from "@/components/appointments/AppointmentForm";

const statusColor = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s.value, s.color]));

export default function AgendaCalendar({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const calendarRef = useRef<CalendarRef>(null);
  const supabase = useMemo(() => createClient(), []);
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carga las citas del rango visible. RLS garantiza que solo llegan las de la empresa.
  const fetchEvents = useCallback(
    async (info: EventSourceFuncInfo) => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, client_id, starts_at, ends_at, reason, notes, status, source, clients!appointments_client_owner_fkey(full_name)")
        .lt("starts_at", info.end.toISOString())
        .gt("ends_at", info.start.toISOString())
        .order("starts_at");
      if (error) {
        console.error("Error cargando citas:", error);
        setError("No se pudieron cargar las citas.");
        return [];
      }
      setError(null);
      return (data as unknown as Appointment[]).map((a) => ({
        id: a.id,
        title: `${a.source === "online" ? "🌐 " : ""}${a.clients?.full_name ?? "Cliente"} · ${a.reason}`,
        start: a.starts_at,
        end: a.ends_at,
        color: statusColor[a.status],
        classNames: a.status === "cancelada" ? ["line-through", "opacity-70"] : [],
        extendedProps: { appointment: a },
      }));
    },
    [supabase],
  );

  const refresh = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
    router.refresh();
  }, [router]);

  function newAppointment(start?: Date, end?: Date, allDay = false) {
    const base = start ?? roundToNextHalfHour(new Date());
    const s = allDay ? setHours(base, 9) : base;
    const e = !end || allDay ? addMinutes(s, 30) : end;
    setDraft({ kind: "new", start: s, end: e });
  }

  function onSelect(info: DateSelectInfo) {
    newAppointment(info.start, info.end, info.allDay);
    calendarRef.current?.getApi().unselect();
  }

  function onEventClick(info: EventClickInfo) {
    setDraft({ kind: "edit", appointment: info.event.extendedProps.appointment as Appointment });
  }

  async function onEventChange(info: EventChangeInfo) {
    const { start, end } = info.event;
    if (!start || !end) return info.revert();
    const res = await moveAppointment(info.event.id, start.toISOString(), end.toISOString());
    if (!res.ok) {
      info.revert();
      setError(res.error);
      return;
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ul className="flex flex-wrap gap-3 text-xs text-slate-600">
            {APPOINTMENT_STATUSES.map((s) => (
              <li key={s.value} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </li>
            ))}
          </ul>
          <button type="button" className="btn-primary" onClick={() => newAppointment()}>+ Nueva cita</button>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, classicThemePlugin]}
          locale={esLocale}
          initialView="timeGridWeek"
          headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
          height="auto"
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          nowIndicator
          selectable
          selectMirror
          editable
          events={fetchEvents}
          select={onSelect}
          eventClick={onEventClick}
          eventDrop={onEventChange}
          eventResize={onEventChange}
        />
      </div>

      {draft && (
        <Modal title={draft.kind === "edit" ? "Editar cita" : "Nueva cita"} onClose={() => setDraft(null)}>
          <AppointmentForm
            draft={draft}
            clients={clients}
            onCancel={() => setDraft(null)}
            onDone={() => {
              setDraft(null);
              refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function roundToNextHalfHour(date: Date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  d.setMinutes(m < 30 ? 30 : 60);
  return d;
}
