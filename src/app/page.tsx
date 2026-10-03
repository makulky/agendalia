import Link from "next/link";

const features = [
  {
    title: "Agenda visual",
    text: "Consulta tus citas por mes, semana o día. Crea, mueve y edita citas con un clic.",
  },
  {
    title: "Tus clientes, ordenados",
    text: "Ficha de cada cliente con teléfono, email y notas, siempre a mano al registrar una cita.",
  },
  {
    title: "Todo tu equipo",
    text: "Varios usuarios por empresa, cada usuario con su propia agenda y con su acceso.",
  },
  {
    title: "Datos seguros y privados",
    text: "Cada empresa solo ve su información. Tus datos están aislados y protegidos.",
  },
];

const steps = [
  { n: "1", title: "Te damos de alta", text: "Creamos la cuenta de tu empresa y los accesos de tu equipo." },
  { n: "2", title: "Registra tus clientes", text: "Añádelos de uno en uno o directamente al crear una cita." },
  { n: "3", title: "Organiza tu agenda", text: "Cliente, día, hora y motivo: la cita aparece al instante." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-600">
            Agendalia
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#funcionalidades" className="hidden hover:text-slate-900 sm:block">Funcionalidades</a>
            <a href="#como-funciona" className="hidden hover:text-slate-900 sm:block">Cómo funciona</a>
            <a href="#contacto" className="hidden hover:text-slate-900 sm:block">Contacto</a>
            <Link href="/login" className="btn-primary">Iniciar sesión</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-indigo-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <p className="mb-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Agenda online para empresas
            </p>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Todas las citas de tu negocio, en un solo lugar
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Agendalia te ayuda a registrar a tus clientes, planificar sus citas y tener el día bajo control,
              desde cualquier dispositivo.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href="#contacto" className="btn-primary px-6 py-3 text-base">Solicitar acceso</a>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">Ya tengo cuenta</Link>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Pensado para tu día a día</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Cómo funciona</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                    {s.n}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">¿Quieres Agendalia para tu empresa?</h2>
          <p className="mt-4 text-slate-600">
            Escríbenos y te preparamos la cuenta de tu empresa y los accesos de tu equipo.
          </p>
          <a href="mailto:hola@agendalia.com" className="btn-primary mt-8 px-6 py-3 text-base">
            agendalia@agendalia.com
          </a>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Agendalia
      </footer>
    </div>
  );
}
