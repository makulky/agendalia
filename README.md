# Agendalia

Agenda online multiempresa: Next.js 16 (App Router) + Tailwind + Supabase.

## Puesta en marcha

1. **Base de datos** — en Supabase Dashboard → SQL Editor, ejecuta en orden los archivos de `supabase/migrations/`
   (`0001_init.sql`, `0002_clientes_por_usuario.sql`, `0003_transferir_clientes.sql`, `0004_reservas_online.sql`).
2. **Desactiva el registro público** — Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
3. **Alta de una empresa** — sigue los pasos de `supabase/admin/crear_empresa.sql`
   (crear empresa → crear usuario en Authentication → vincularlo en `profiles`).
4. **Variables de entorno** — copia `.env.local.example` a `.env.local` y rellena la URL, la anon key y la
   service role key (esta última solo se usa en el servidor, para que el admin gestione usuarios desde "Equipo").
5. `npm install` y `npm run dev` → http://localhost:3000

## Estructura

- `src/app/page.tsx` — landing pública
- `src/app/login` — inicio de sesión
- `src/app/app` — área privada (agenda y clientes) + server actions (`actions.ts`)
- `src/components` — calendario (FullCalendar), formularios de citas y clientes
- `src/proxy.ts` — refresca la sesión y protege `/app`
- `supabase/` — esquema SQL con RLS (cada empresa solo ve sus datos)
