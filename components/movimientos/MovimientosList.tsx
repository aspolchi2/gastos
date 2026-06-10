"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Loader2 } from "lucide-react";

import {
  gastoCategorias,
  ingresoCategorias,
  ahorroCategorias,
} from "@/lib/data";
import type { categoriaProps } from "@/lib/types";
import type { Clase, Movimiento } from "@/app/utils/movimientos";

const META = new Map<string, categoriaProps>(
  [...gastoCategorias, ...ingresoCategorias, ...ahorroCategorias].map((c) => [
    c.slug,
    c,
  ]),
);

// Color del monto según la clase de movimiento.
const COLOR_CLASE: Record<Clase, string> = {
  Gasto: "#FCA5A5",
  Ingreso: "#86EFAC",
  Ahorro: "#C4B5FD",
};

function fmt(cents: number, currency: "ARS" | "USD") {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency });
}

// Las fechas se guardan a medianoche UTC; formateamos en UTC para no correrlas
// un día en AR (UTC-3).
function fmtFecha(d: Date) {
  const utc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  return format(utc, "EEE d MMM", { locale: es });
}

export default function MovimientosList({
  movimientos,
}: {
  movimientos: Movimiento[];
}) {
  const router = useRouter();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const borrar = async (m: Movimiento) => {
    setDeletingId(m.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/movimientos?coleccion=${m.coleccion}&id=${m.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo borrar");
      }
      setConfirmId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setDeletingId(null);
    }
  };

  if (movimientos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">No hay movimientos en el período.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {movimientos.map((m) => {
        const meta = m.categoria ? META.get(m.categoria) : undefined;
        const color = meta?.color ?? "#93C5FD";
        const titulo = meta?.title ?? m.categoria ?? m.clase;
        const esCambio = Boolean(m.cambioId);
        const confirmando = confirmId === m.id;
        const borrando = deletingId === m.id;
        return (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1f`, color }}
            >
              {meta?.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-white">
                {titulo}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                {m.clase}
                {m.tipo ? ` · ${m.tipo === "fijo" ? "Fijo" : "Variable"}` : ""}
                {" · "}
                {fmtFecha(m.fecha)}
              </p>
            </div>
            <p
              className="shrink-0 text-sm font-semibold tabular-nums"
              style={{ color: COLOR_CLASE[m.clase] }}
            >
              {fmt(m.monto, m.moneda)}
            </p>

            {confirmando ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => borrar(m)}
                  disabled={borrando}
                  className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300 disabled:opacity-60"
                >
                  {borrando ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : esCambio ? (
                    "Borrar par"
                  ) : (
                    "Borrar"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  disabled={borrando}
                  className="rounded-md px-2 py-1 text-xs text-zinc-400"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Borrar"
                onClick={() => {
                  setConfirmId(m.id);
                  setError(null);
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-red-300"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
