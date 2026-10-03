import type { ClientInput } from "@/app/app/actions";

// Campos reutilizables para crear/editar un cliente (también desde el formulario de citas).
export default function ClientFields({
  value,
  onChange,
  showNotes = true,
}: {
  value: ClientInput;
  onChange: (value: ClientInput) => void;
  showNotes?: boolean;
}) {
  const set = (field: keyof ClientInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="client_full_name">Nombre y apellidos *</label>
        <input id="client_full_name" className="input" value={value.full_name} onChange={set("full_name")} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="client_phone">Teléfono</label>
          <input id="client_phone" type="tel" className="input" value={value.phone ?? ""} onChange={set("phone")} />
        </div>
        <div>
          <label className="label" htmlFor="client_email">Email</label>
          <input id="client_email" type="email" className="input" value={value.email ?? ""} onChange={set("email")} />
        </div>
      </div>
      {showNotes && (
        <div>
          <label className="label" htmlFor="client_notes">Notas</label>
          <textarea id="client_notes" rows={3} className="input" value={value.notes ?? ""} onChange={set("notes")} />
        </div>
      )}
    </div>
  );
}
