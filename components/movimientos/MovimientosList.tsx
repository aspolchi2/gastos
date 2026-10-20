"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { comoLocal, diaUTC } from "@/lib/fecha";
import { Trash2, Loader2 } from "lucide-react";

import {
  gastoCategorias,
  ingresoCategorias,
  ahorroCategorias,
  origenes,
} from "@/lib/data";
import type { categoriaProps } from "@/lib/types";
import type { Clase, Movimiento } from "@/app/utils/movimientos";
import { formatMonto } from "@/lib/format";

const META = new Map<string, categoriaProps>(
  [...gastoCategorias, ...ingresoCategorias, ...ahorroCategorias].map((c) => [
    c.slug,
    c,
  ]),
);

// Color del monto según la clase de movimiento.
const COLOR_CLASE: Record<Clase, string> = {
  Gasto: "var(--color-gasto)",
  Ingreso: "var(--color-ingreso)",
  Ahorro: "var(--color-ahorro)",
};

const ORIGENES = new Map(origenes.map((o) => [o.slug, o.title]));

// Segunda línea de la fila: el detalle que cargaron, qué es y, en gastos, si
// salió de un ahorro.
function detalle(m: Movimiento) {
  if (m.cambioId) return "Cambio de divisas";
  const partes = m.detalle ? [m.detalle] : [];
  if (m.clase !== "Gasto") return [...partes, m.clase].join(" · ");
  partes.push(m.tipo === "fijo" ? "Fijo" : "Variable");
  // El origen habitual es el sueldo; solo lo mostramos cuando sale de otro lado.
  if (m.origen && m.origen !== "ingresos-mensuales") {
    partes.push(ORIGENES.get(m.origen) ?? m.origen);
  }
  return partes.join(" · ");
}

// Las fechas se guardan a medianoche UTC; formateamos en UTC para no correrlas
// un día en AR (UTC-3).
function fmtDia(d: Date) {
  const s = format(comoLocal(d), "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
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
      <p className="py-12 text-center text-sm text-zinc-400">
        No hay movimientos en el período.
      </p>
    );
  }

  // La lista llega ordenada de más reciente a más antigua: agrupamos por día
  // manteniendo ese orden.
  const dias: { key: string; fecha: Date; movs: Movimiento[] }[] = [];
  for (const m of movimientos) {
    const key = diaUTC(m.fecha);
    const ultimo = dias[dias.length - 1];
    if (ultimo?.key === key) ultimo.movs.push(m);
    else dias.push({ key, fecha: m.fecha, movs: [m] });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {dias.map((dia) => (
        <section key={dia.key} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-xs font-medium text-zinc-400">
              {fmtDia(dia.fecha)}
            </h2>
            <GastadoDia movs={dia.movs} />
          </div>
          <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {dia.movs.map((m) => (
              <Fila
                key={m.id}
                m={m}
                confirmando={confirmId === m.id}
                borrando={deletingId === m.id}
                onPedirBorrar={() => {
                  setConfirmId(m.id);
                  setError(null);
                }}
                onCancelar={() => setConfirmId(null)}
                onBorrar={() => borrar(m)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Gastado en el día (solo gastos; ingresos y ahorros no suman acá).
function GastadoDia({ movs }: { movs: Movimiento[] }) {
  const gastos = movs.filter((m) => m.clase === "Gasto");
  if (gastos.length === 0) return null;
  const sum = (moneda: "ARS" | "USD") =>
    gastos.filter((m) => m.moneda === moneda).reduce((a, m) => a + m.monto, 0);
  const ars = sum("ARS");
  const usd = sum("USD");
  return (
    <span className="text-xs tabular-nums text-zinc-500">
      {[ars && formatMonto(ars, "ARS"), usd && formatMonto(usd, "USD")].filter(Boolean).join(" · ")}
    </span>
  );
}

function Fila({
  m,
  confirmando,
  borrando,
  onPedirBorrar,
  onCancelar,
  onBorrar,
}: {
  m: Movimiento;
  confirmando: boolean;
  borrando: boolean;
  onPedirBorrar: () => void;
  onCancelar: () => void;
  onBorrar: () => void;
}) {
  const meta = m.categoria ? META.get(m.categoria) : undefined;
  const color = meta?.color ?? "#93C5FD";
  const titulo = meta?.title ?? m.categoria ?? m.clase;

  return (
    <div className="flex min-h-16 items-center gap-3 px-3 py-2.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4.5"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {meta?.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-white">{titulo}</h3>
        <p className="mt-0.5 truncate text-xs text-zinc-400">{detalle(m)}</p>
      </div>

      {confirmando ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCancelar}
            disabled={borrando}
            className="pressable h-8 rounded-md px-2.5 text-xs text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onBorrar}
            disabled={borrando}
            className="pressable flex h-8 min-w-16 items-center justify-center rounded-md bg-red-500/20 px-2.5 text-xs font-medium text-red-300 disabled:opacity-60"
          >
            {borrando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : m.cambioId ? (
              "Borrar par"
            ) : (
              "Borrar"
            )}
          </button>
        </div>
      ) : (
        <>
          <p
            className="shrink-0 text-sm font-semibold tabular-nums"
            style={{ color: COLOR_CLASE[m.clase] }}
          >
            {formatMonto(m.monto, m.moneda)}
          </p>
          <button
            type="button"
            aria-label="Borrar"
            onClick={onPedirBorrar}
            className="pressable -mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
