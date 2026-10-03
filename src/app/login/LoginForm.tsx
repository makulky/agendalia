"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
        <p className="font-medium">Cuenta de prueba</p>
        <p>
          Para probar la aplicación usa el email <strong>prueba@prueba.com</strong> y la contraseña{" "}
          <strong>123456</strong> (ya vienen rellenados).
        </p>
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue="prueba@prueba.com" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" defaultValue="123456" required className="input" />
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
