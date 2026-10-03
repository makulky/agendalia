import Link from "next/link";
import { getSession } from "@/lib/session";
import { logout } from "@/app/login/actions";
import NavLinks from "./NavLinks";

export default async function PrivateLayout({ children }: LayoutProps<"/app">) {
  const { user, profile } = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/app" className="text-xl font-bold tracking-tight text-indigo-600">Agendalia</Link>
            <NavLinks isAdmin={profile?.role === "admin"} />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium text-slate-900">{profile?.companies?.name ?? "Sin empresa"}</p>
              <p className="text-slate-500">{profile?.full_name || user.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="btn-secondary">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {profile ? (
          children
        ) : (
          <div className="rounded-xl bg-amber-50 p-6 text-amber-800 ring-1 ring-amber-200">
            Tu usuario todavía no está vinculado a ninguna empresa. Contacta con el administrador de Agendalia.
          </div>
        )}
      </main>
    </div>
  );
}
