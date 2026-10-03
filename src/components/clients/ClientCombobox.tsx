"use client";

import { useId, useRef, useState } from "react";
import type { Client } from "@/lib/types";

const MAX_RESULTS = 50;

// Minúsculas y sin tildes, para buscar "jose" y encontrar "José"
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ClientCombobox({
  clients,
  value,
  onChange,
  onCreateNew,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  onCreateNew: (name: string) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selected = clients.find((c) => c.id === value);

  const q = normalize(query.trim());
  const matches = q
    ? clients.filter((c) => [c.full_name, c.phone, c.email].some((v) => v && normalize(v).includes(q)))
    : clients;
  const results = matches.slice(0, MAX_RESULTS);

  function select(client: Client) {
    onChange(client.id);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(true);
    setHighlight(0);
    // Espera a que se pinte el campo de búsqueda para enfocarlo
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      // Evita que Enter envíe el formulario de la cita
      e.preventDefault();
      if (open && results[highlight]) select(results[highlight]);
    } else if (e.key === "Escape" && open) {
      // No cierra el modal, solo el desplegable
      e.stopPropagation();
      setOpen(false);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm">
        <span>
          <span className="font-medium text-slate-900">{selected.full_name}</span>
          {selected.phone && <span className="ml-2 text-slate-500">{selected.phone}</span>}
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="Cambiar cliente"
          className="rounded-md px-1.5 text-slate-400 hover:bg-indigo-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[highlight] ? `${listId}-${highlight}` : undefined}
        className="input"
        placeholder="Busca por nombre, teléfono o email…"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200"
        >
          {results.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === highlight}
              // mousedown + preventDefault: elige antes de que el blur cierre la lista
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ${
                i === highlight ? "bg-indigo-600 text-white" : "text-slate-900"
              }`}
            >
              <span className="font-medium">{c.full_name}</span>
              <span className={`truncate ${i === highlight ? "text-indigo-100" : "text-slate-500"}`}>
                {c.phone || c.email}
              </span>
            </li>
          ))}

          {matches.length > MAX_RESULTS && (
            <li className="px-3 py-2 text-xs text-slate-500">
              {matches.length - MAX_RESULTS} más… sigue escribiendo para afinar.
            </li>
          )}

          {results.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              {clients.length === 0 ? "Todavía no tienes clientes." : "No hay coincidencias."}
            </li>
          )}

          {query.trim() && results.length === 0 && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onCreateNew(query.trim());
                }}
                className="w-full px-3 py-2 text-left font-medium text-indigo-600 hover:bg-indigo-50"
              >
                + Crear «{query.trim()}» como nuevo cliente
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
