import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Iniciar sesión · Agendalia" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-indigo-600">
          Agendalia
        </Link>
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">Accede a tu agenda</h1>
          <p className="mb-6 text-sm text-slate-500">Usa las credenciales que te ha facilitado Agendalia.</p>
          <LoginForm />
        </div>
        <div className="mt-6 text-center">
          <Link href="/" className="btn-secondary">
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </main>
  );
}
