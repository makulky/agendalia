"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";
import { deleteClient, saveClient, type ClientInput } from "@/app/app/actions";
import Modal from "@/components/Modal";
import ClientFields from "./ClientFields";

const empty: ClientInput = { full_name: "", phone: "", email: "", notes: "" };

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; value: ClientInput } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const q = search.trim().toLowerCase();
  const filtered = q
    ? clients.filter((c) => [c.full_name, c.phone, c.email].some((v) => v?.toLowerCase().includes(q)))
    : clients;

  function open(client?: Client) {
    setError(null);
    setEditing(
      client
        ? { id: client.id, value: { full_name: client.full_name, phone: client.phone ?? "", email: client.email ?? "", notes: client.notes ?? "" } }
        : { id: null, value: empty },
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      const res = await saveClient(editing.id, editing.value);
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });
  }

  function onDelete() {
    if (!editing?.id) return;
    if (!confirm("¿Eliminar este cliente? También se eliminarán todas sus citas.")) return;
    startTransition(async () => {
      const res = await deleteClient(editing.id!);
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre, teléfono o email…"
            className="input w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={() => open()}>+ Nuevo cliente</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => open(c)} className="cursor-pointer hover:bg-indigo-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{c.email}</td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-slate-500 md:table-cell">{c.notes}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  {clients.length === 0 ? "Todavía no tienes clientes. ¡Crea el primero!" : "No hay resultados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar cliente" : "Nuevo cliente"} onClose={() => setEditing(null)}>
          <form onSubmit={onSubmit} className="space-y-5">
            <ClientFields value={editing.value} onChange={(value) => setEditing({ ...editing, value })} />
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-center justify-between">
              {editing.id ? (
                <button type="button" className="btn-danger" onClick={onDelete} disabled={pending}>Eliminar</button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
