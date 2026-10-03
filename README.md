# Agendalia

**Agendalia** es una agenda online **multiempresa** pensada para negocios que trabajan con citas
(clínicas, centros de estética, consultas, talleres, academias…). Cada empresa tiene su propio espacio
aislado, con varios usuarios, y cada profesional gestiona su agenda, sus clientes y su página pública
de reservas.

La interfaz está en español y los teléfonos sin prefijo se tratan como españoles (+34).

---

## Funcionalidades

### Agenda (`/app`)
- Calendario interactivo con vistas de **mes, semana, día y lista** (FullCalendar, en español).
- Crear citas seleccionando un hueco en el calendario; editar o borrar haciendo clic en ellas.
- **Arrastrar y soltar** para mover una cita o cambiar su duración.
- Cada cita tiene cliente, inicio/fin, motivo, notas y **estado** con color:
  `pendiente`, `confirmada`, `completada` y `cancelada` (las canceladas aparecen tachadas).
- Las citas que llegan por la página de reservas se marcan con 🌐.
- Al crear una cita se puede elegir un cliente existente (buscador) o **darlo de alta en el momento**.

### Clientes (`/app/clientes`)
- Listado con buscador por nombre, teléfono o email.
- Ficha de cliente con nombre, teléfono, email y notas. Alta, edición y borrado.
- Cada usuario ve **solo sus propios clientes**.

### Recordatorios (`/app/recordatorios`)
- Lista de las citas de **mañana** (sin contar las canceladas).
- Botón **Enviar** que abre WhatsApp (`wa.me`) con un mensaje ya redactado:
  *"Hola! {cliente}, tienes cita mañana a las {hora} en {empresa}. Motivo: …"*.
  El envío lo confirma el usuario en WhatsApp; no hay API de mensajería de pago.
- Avisa si el cliente no tiene un teléfono válido.

### Disponibilidad y reservas online (`/app/disponibilidad` y `/reservar/[slug]`)
- Cada profesional configura su **horario semanal** con varias franjas por día (p. ej. mañana y tarde),
  con la opción de copiar un día al resto de días laborables.
- Elige la **duración de las citas** (5–240 min) y un **enlace propio** (`/reservar/mi-nombre`).
- Página pública, sin login, donde el cliente elige día y hora libre e indica nombre, teléfono y motivo.
- Los huecos libres y la reserva se calculan en la base de datos (funciones SQL `get_available_slots`,
  `book_appointment`, `get_booking_page`), teniendo en cuenta la zona horaria del profesional
  y controlando que dos personas no reserven el mismo hueco.
- Protección antispam con un campo trampa (*honeypot*).

### Equipo (`/app/equipo`, solo administradores)
- Alta de usuarios de la empresa con email, contraseña y rol (`admin` / `member`).
- Cambio de rol, restablecimiento de contraseña y baja de usuarios.
- **Transferencia de clientes** (con sus citas) de un usuario a otro. No se puede borrar un usuario
  que todavía tenga clientes: antes hay que transferirlos.

### Otras partes
- **Landing pública** (`/`) que presenta el producto.
- **Inicio de sesión** con email y contraseña (`/login`). No hay registro público: las empresas
  y sus usuarios los da de alta un administrador.

---

## Tecnología

| Área | Tecnología |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) |
| UI | React 19 + [Tailwind CSS 4](https://tailwindcss.com) |
| Lenguaje | TypeScript 5 |
| Backend / BD | [Supabase](https://supabase.com): PostgreSQL, Auth y Row Level Security (RLS) |
| Cliente Supabase | `@supabase/ssr` (sesión por cookies) y `@supabase/supabase-js` |
| Calendario | `@fullcalendar/react` 7 |
| Validación | [Zod 4](https://zod.dev) en todas las server actions |
| Fechas | `date-fns` y `temporal-polyfill` |
| Calidad | ESLint 9 (`eslint-config-next`) |

### Arquitectura y seguridad
- **Multiempresa con RLS**: cada fila pertenece a una empresa y a un usuario; las políticas de
  Supabase hacen que cada usuario solo lea y escriba sus propios datos.
- Las escrituras pasan por **server actions** (`actions.ts`) que validan con Zod antes de llegar a Supabase.
  Las lecturas del calendario y de recordatorios se hacen desde el navegador, protegidas por RLS.
- `src/proxy.ts` (el antiguo *middleware* en Next.js 16) refresca la sesión y protege `/app` y `/login`.
- La **service role key** solo se usa en el servidor (`src/lib/supabase/admin.ts`, marcado `server-only`)
  para gestionar usuarios de Auth desde "Equipo", siempre después de comprobar que quien llama es admin
  y que el usuario objetivo es de su empresa.
- La lógica sensible de las reservas públicas vive en funciones SQL `security definer`.

---

## Estructura

```
src/
├── app/
│   ├── page.tsx                  # Landing pública
│   ├── login/                    # Inicio de sesión (formulario + actions)
│   ├── reservar/[slug]/          # Página pública de reservas
│   └── app/                      # Área privada
│       ├── layout.tsx            # Cabecera, navegación y comprobación de empresa
│       ├── actions.ts            # Server actions de clientes y citas
│       ├── page.tsx              # Agenda
│       ├── clientes/             # Clientes
│       ├── recordatorios/        # Recordatorios por WhatsApp
│       ├── disponibilidad/       # Horario y ajustes de reservas
│       └── equipo/               # Gestión de usuarios (admin)
├── components/
│   ├── calendar/                 # AgendaCalendar (FullCalendar)
│   ├── appointments/             # Formulario de citas
│   ├── clients/                  # Tabla, ficha y buscador de clientes
│   ├── booking/                  # Ajustes de disponibilidad y formulario público
│   ├── reminders/                # Recordatorios de mañana
│   ├── team/                     # Miembros y transferencia de clientes
│   └── Modal.tsx
├── lib/
│   ├── supabase/                 # Clientes de Supabase (navegador, servidor, proxy, admin)
│   ├── session.ts                # Usuario + perfil + empresa de la sesión
│   ├── types.ts                  # Tipos y estados de citas
│   └── whatsapp.ts               # Normalización de teléfonos y enlaces wa.me
└── proxy.ts                      # Protección de rutas y refresco de sesión
```

### Modelo de datos (Supabase)
- `companies` — empresas.
- `profiles` — usuarios vinculados a una empresa, con rol, enlace de reservas, duración de cita y zona horaria.
- `clients` — clientes, cada uno con su usuario propietario (`owner_id`).
- `appointments` — citas, con estado y origen (`interno` / `online`).
- `availability` — franjas horarias semanales de cada usuario.
- Funciones RPC: `transfer_clients`, `admin_list_clients`, `get_booking_page`,
  `get_available_slots`, `book_appointment`.

---

## Puesta en marcha

> ⚠️ Los scripts SQL (`supabase/migrations/` y `supabase/admin/`) y el archivo `.env.local.example`
> no están incluidos en este repositorio. Hay que añadirlos para poder crear la base de datos desde cero.

1. **Base de datos** — en Supabase Dashboard → SQL Editor, ejecuta en orden las migraciones
   (`0001_init.sql`, `0002_clientes_por_usuario.sql`, `0003_transferir_clientes.sql`, `0004_reservas_online.sql`).
2. **Desactiva el registro público** — Authentication → Sign In / Providers → desactiva "Allow new users to sign up".
3. **Alta de una empresa** — crea la empresa, crea el usuario en Authentication y vincúlalo en `profiles`
   con rol `admin` (script `supabase/admin/crear_empresa.sql`). A partir de ahí, el admin puede dar de alta
   al resto del equipo desde "Equipo".
4. **Variables de entorno** — crea `.env.local` con:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # solo servidor; necesaria para "Equipo"
   ```
5. Instala y arranca:
   ```bash
   npm install
   npm run dev     # http://localhost:3000
   ```

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
