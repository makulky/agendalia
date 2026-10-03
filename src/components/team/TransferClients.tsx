"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CompanyClient, TeamMember } from "@/lib/types";
import { transferClients } from "@/app/app/actions";

export default function TransferClients({
  currentUserId,
  members,
  clients,
}: {
  currentUserId: string;
  members: TeamMember[];
  clients: CompanyClient[];
}) {
  const router = useRouter();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const name = (id: string) => {
    const m = members.find((m) => m.id === id);
    return m ? `${m.full_name || "Sin nombre"}${m.id === currentUserId ? " (tú)" : ""}` : "—";
  };
  const countByOwner = (id: string) => clients.filter((c) => c.owner_id === id).length;

  const q = search.trim().toLowerCase();
  const fromClients = clients.filter((c) => c.owner_id === fromId);
  const visible = q
    ? fromClients.filter((c) => [c.full_name, c.phone, c.email].some((v) => v?.toLowerCase().includes(q)))
    : fromClients;
  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));

  function changeFrom(id: string) {
    setFromId(id);
    setSelected(new Set());
    setSearch("");
    setMessage(null);
    if (id === toId) setToId("");
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAllVisible() {
    const next = new Set(selected);
    visible.forEach((c) => (allVisibleSelected ? next.delete(c.id) : next.add(c.id)));
    setSelected(next);
  }

  function onTransfer() {
    if (selected.size === 0 || !toId) return;
    const n = selected.size;
    if (!confirm(`¿Pasar ${n} cliente(s) y todas sus citas de ${name(fromId)} a ${name(toId)}?`)) return;
    startTransition(async () => {
      const res = await transferClients([...selected], toId);
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: `${n} cliente(s) transferido(s) a ${name(toId)}.` });
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Transferir clientes</h2>
        <p className="text-sm text-slate-500">
          Los clientes seleccionados pasan a la agenda de otro compañero junto con todas sus citas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="from">Desde</label>
          <select id="from" className="input" value={fromId} onChange={(e) => changeFrom(e.target.value)}>
            <option value="">Selecciona un usuario…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{name(m.id)} · {countByOwner(m.id)} clientes</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="to">Pasar a</label>
          <select id="to" className="input" value={toId} onChange={(e) => setToId(e.target.value)} disabled={!fromId}>
            <option value="">Selecciona un usuario…</option>
            {members
              .filter((m) => m.id !== fromId)
              .map((m) => (
                <option key={m.id} value={m.id}>{name(m.id)}</option>
              ))}
          </select>
        </div>
      </div>

      {fromId && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={visible.length === 0}
              />
              Seleccionar todos{q ? " los resultados" : ""}
            </label>
            <input
              type="search"
              className="input w-64"
              placeholder="Buscar cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200">
            {visible.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-50/50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="font-medium text-slate-900">{c.full_name}</span>
                  <span className="text-slate-500">{[c.phone, c.email].filter(Boolean).join(" · ")}</span>
                </label>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                {fromClients.length === 0 ? "Este usuario no tiene clientes." : "No hay resultados."}
              </li>
            )}
          </ul>
        </div>
      )}

      {message && (
        <p className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary"
          onClick={onTransfer}
          disabled={pending || selected.size === 0 || !toId}
        >
          {pending ? "Transfiriendo…" : `Transferir (${selected.size})`}
        </button>
      </div>
    </section>
  );
}
