export type AppointmentStatus = "pendiente" | "confirmada" | "cancelada" | "completada";

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "#f59e0b" },
  { value: "confirmada", label: "Confirmada", color: "#4f46e5" },
  { value: "completada", label: "Completada", color: "#16a34a" },
  { value: "cancelada", label: "Cancelada", color: "#9ca3af" },
];

export type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type TeamMember = {
  id: string;
  full_name: string;
  role: "admin" | "member";
};

// Cliente de cualquier usuario de la empresa (solo lo recibe el admin)
export type CompanyClient = Client & { owner_id: string };

export type Appointment = {
  id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  notes: string | null;
  status: AppointmentStatus;
  source?: "interno" | "online";
  clients: { full_name: string } | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };
