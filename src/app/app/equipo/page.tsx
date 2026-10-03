import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import type { CompanyClient, TeamMember } from "@/lib/types";
import TeamMembers, { type MemberRow } from "@/components/team/TeamMembers";
import TransferClients from "@/components/team/TransferClients";

export const metadata: Metadata = { title: "Equipo · Agendalia" };

export default async function EquipoPage() {
  const { supabase, user, profile } = await getSession();
  if (profile?.role !== "admin") notFound();

  const [{ data: membersData }, { data: clientsData, error }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
    supabase.rpc("admin_list_clients"),
  ]);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 ring-1 ring-red-200">
        No se pudieron cargar los clientes de la empresa. ¿Has ejecutado la migración 0003?
      </div>
    );
  }

  const members = (membersData ?? []) as TeamMember[];
  const clients = (clientsData ?? []) as CompanyClient[];

  // Los emails viven en Auth, no en profiles: solo se pueden leer con la service role key.
  const canManage = hasAdminKey();
  const emails = new Map<string, string | null>();
  if (canManage) {
    const admin = createAdminClient();
    await Promise.all(
      members.map(async (m) => {
        const { data } = await admin.auth.admin.getUserById(m.id);
        emails.set(m.id, data.user?.email ?? null);
      }),
    );
  }

  const rows: MemberRow[] = members.map((m) => ({
    ...m,
    email: emails.get(m.id) ?? null,
    clientCount: clients.filter((c) => c.owner_id === m.id).length,
  }));

  return (
    <div className="space-y-8">
      <TeamMembers currentUserId={user.id} members={rows} canManage={canManage} />
      <TransferClients currentUserId={user.id} members={members} clients={clients} />
    </div>
  );
}
