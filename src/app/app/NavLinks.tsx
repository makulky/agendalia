"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Agenda" },
  { href: "/app/clientes", label: "Clientes" },
  { href: "/app/recordatorios", label: "Recordatorios" },
  { href: "/app/disponibilidad", label: "Disponibilidad" },
];

const adminLinks = [{ href: "/app/equipo", label: "Equipo" }];

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto whitespace-nowrap">
      {(isAdmin ? [...links, ...adminLinks] : links).map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
