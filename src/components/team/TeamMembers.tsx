"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@/lib/types";
import {
  createMember,
  deleteMember,
  resetMemberPassword,
  updateMemberRole,
  type MemberInput,
} from "@/app/app/equipo/actions";
import Modal from "@/components/Modal";

export type MemberRow = TeamMember & { email: string | null; clientCount: number };

const emptyMember: MemberInput = { full_name: "", email: "", role: "member", password: "" };

export default function TeamMembers({
  currentUserId,
  members,
  canManage,
}: {
  currentUserId: string;
  members: MemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState<MemberInput | null>(null);
  const [resetting, setResetting] = useState<{ member: MemberRow; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) return setError(res.error ?? "Ha ocurrido un error");
      after?.();
      setNotice(success);
      router.refresh();
    });
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!creating) return;
    run(() => createMember(creating), `Usuario ${creating.email} creado. Pásale su email y contraseña.`, () =>
      setCreating(null),
    );
  }

  function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetting) return;
    run(
      () => resetMemberPassword(resetting.member.id, resetting.password),
      `Contraseña de ${resetting.member.full_name} actualizada.`,
      () => setResetting(null),
    );
  }

  function onRoleChange(member: MemberRow, role: "admin" | "member") {
    run(() => updateMemberRole(member.id, role), `${member.full_name} ahora es ${role === "admin" ? "administrador" : "miembro"}.`);
  }

  function onDelete(member: MemberRow) {
    if (!confirm(`¿Eliminar a ${member.full_name} (${member.email})? No podrá volver a iniciar sesión.`)) return;
    run(() => deleteMember(member.id), `${member.full_name} eliminado.`);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Equipo</h1>
        {canManage && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setError(null);
              setCreating(emptyMember);
            }}
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {!canManage && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          Para crear y gestionar usuarios añade <code>SUPABASE_SERVICE_ROLE_KEY</code> a <code>.env.local</code> y
          reinicia el servidor.
        </p>
      )}
      {error && !creating && !resetting && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 text-right font-medium">Clientes</th>
              {canManage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => {
              const isMe = m.id === currentUserId;
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {m.full_name || "Sin nombre"}
                      {isMe && " (tú)"}
                    </p>
                    {m.email && <p className="text-slate-500">{m.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !isMe ? (
                      <select
                        className="input w-auto py-1"
                        value={m.role}
                        disabled={pending}
                        onChange={(e) => onRoleChange(m, e.target.value as "admin" | "member")}
                      >
                        <option value="member">Miembro</option>
                        <option value="admin">Administrador</option>
                      </select>
                    ) : (
                      <span className="text-slate-600">{m.role === "admin" ? "Administrador" : "Miembro"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.clientCount}</td>
                  {canManage && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          setResetting({ member: m, password: "" });
                        }}
                      >
                        Contraseña
                      </button>
                      {!isMe && (
                        <button
                          type="button"
                          className="btn-danger ml-1 px-3 py-1"
                          disabled={pending}
                          title={m.clientCount ? "Transfiere antes sus clientes" : undefined}
                          onClick={() => onDelete(m)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="Nuevo usuario" onClose={() => setCreating(null)}>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="label" htmlFor="m_name">Nombre y apellidos *</label>
              <input
                id="m_name"
                className="input"
                required
                value={creating.full_name}
                onChange={(e) => setCreating({ ...creating, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="m_email">Email *</label>
                <input
                  id="m_email"
                  type="email"
                  className="input"
                  required
                  autoComplete="off"
                  value={creating.email}
                  onChange={(e) => setCreating({ ...creating, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label" htmlFor="m_role">Rol</label>
                <select
                  id="m_role"
                  className="input"
                  value={creating.role}
                  onChange={(e) => setCreating({ ...creating, role: e.target.value as "admin" | "member" })}
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <PasswordField value={creating.password} onChange={(password) => setCreating({ ...creating, password })} />
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setCreating(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Creando…" : "Crear usuario"}</button>
            </div>
          </form>
        </Modal>
      )}

      {resetting && (
        <Modal title={`Nueva contraseña · ${resetting.member.full_name}`} onClose={() => setResetting(null)}>
          <form onSubmit={onReset} className="space-y-4">
            <PasswordField value={resetting.password} onChange={(password) => setResetting({ ...resetting, password })} />
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setResetting(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Guardando…" : "Guardar contraseña"}</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function PasswordField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  function generate() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    onChange(Array.from(bytes, (b) => chars[b % chars.length]).join(""));
  }

  return (
    <div>
      <label className="label" htmlFor="m_password">Contraseña * <span className="font-normal text-slate-500">(mín. 8 caracteres)</span></label>
      <div className="flex gap-2">
        <input
          id="m_password"
          type="text"
          className="input font-mono"
          required
          minLength={8}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn-secondary whitespace-nowrap" onClick={generate}>Generar</button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Se muestra en claro para que puedas copiarla y pasársela al usuario.</p>
    </div>
  );
}
