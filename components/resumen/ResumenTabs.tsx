"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingDown, TrendingUp, PiggyBank } from "lucide-react";

import {
  gastoCategorias,
  ingresoCategorias,
  ahorroCategorias,
  origenes,
} from "@/lib/data";
import type { categoriaProps } from "@/lib/types";
import type { Saldos } from "@/app/utils/saldos";
import type { Movimiento } from "@/app/utils/movimientos";

export type CatTotal = { slug: string; ars: number; usd: number };
export type TabData = { items: CatTotal[]; totalArs: number; totalUsd: number };

type Props = {
  gastos: TabData;
  ingresos: TabData;
  ahorros: TabData;
  saldos: Saldos;
  fijoArs: number;
  variableArs: number;
  gastosDetalle: Movimiento[];
};

type TabKey = "gastos" | "disponible" | "ahorros" | "ingresos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "gastos", label: "Gastos" },
  { key: "disponible", label: "Disponible" },
  { key: "ahorros", label: "Ahorros" },
  { key: "ingresos", label: "Ingresos" },
];

function fmt(cents: number, currency: "ARS" | "USD" = "ARS") {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency,
  });
}

function montoLabel(ars: number, usd: number) {
  const partes = [fmt(ars, "ARS")];
  if (usd !== 0) partes.push(fmt(usd, "USD"));
  return partes.join(" · ");
}

function metaMap(cats: categoriaProps[]) {
  return new Map(cats.map((c) => [c.slug, c]));
}

const FALLBACK_COLOR = "#93C5FD";

// Lista de barras por categoría a partir de un TabData.
function CategoryBars({
  data,
  metas,
  emptyText,
}: {
  data: TabData;
  metas: Map<string, categoriaProps>;
  emptyText: string;
}) {
  const max = data.items.reduce((acc, i) => Math.max(acc, i.ars), 0);
  if (data.items.length === 0) {
    return <p className="text-sm text-zinc-400">{emptyText}</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {data.items.map((item) => {
        const meta = metas.get(item.slug);
        const color = meta?.color ?? FALLBACK_COLOR;
        const pct = max > 0 ? Math.round((item.ars / max) * 100) : 0;
        return (
          <div key={item.slug} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-white">
                {meta?.title ?? item.slug}
              </span>
              <span className="text-sm tabular-nums text-zinc-300">
                {montoLabel(item.ars, item.usd)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// "Martes 9/6/2026". Las fechas se guardan a medianoche UTC; usamos getters UTC
// para no correr el día en AR (UTC-3).
function fmtDia(d: Date) {
  const utc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const s = format(utc, "EEEE d/M/yyyy", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Detalle de gastos individuales agrupados por día (la lista llega ordenada de
// más reciente a más antigua).
function GastoDetalle({
  items,
  metas,
}: {
  items: Movimiento[];
  metas: Map<string, categoriaProps>;
}) {
  if (items.length === 0) return null;

  const grupos: { key: string; fecha: Date; movs: Movimiento[] }[] = [];
  const idx = new Map<string, number>();
  for (const m of items) {
    const f = m.fecha;
    const key = `${f.getUTCFullYear()}-${f.getUTCMonth()}-${f.getUTCDate()}`;
    let i = idx.get(key);
    if (i === undefined) {
      i = grupos.length;
      idx.set(key, i);
      grupos.push({ key, fecha: f, movs: [] });
    }
    grupos[i].movs.push(m);
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-zinc-300">Detalle por día</h3>
      {grupos.map((g) => {
        const totalArs = g.movs
          .filter((m) => m.moneda === "ARS")
          .reduce((a, m) => a + m.monto, 0);
        const totalUsd = g.movs
          .filter((m) => m.moneda === "USD")
          .reduce((a, m) => a + m.monto, 0);
        return (
          <div key={g.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {fmtDia(g.fecha)}
              </span>
              <span className="text-xs tabular-nums text-zinc-500">
                {montoLabel(totalArs, totalUsd)}
              </span>
            </div>
            {g.movs.map((m) => {
              const meta = m.categoria ? metas.get(m.categoria) : undefined;
              const color = meta?.color ?? FALLBACK_COLOR;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate text-sm text-white">
                      {meta?.title ?? m.categoria}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-zinc-300">
                    {fmt(m.monto, m.moneda)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Hero({
  label,
  ars,
  usd,
  accent,
  icon,
}: {
  label: string;
  ars: number;
  usd: number;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <p
        className="mt-1 text-3xl font-bold tabular-nums"
        style={{ color: ars < 0 ? "#FCA5A5" : undefined }}
      >
        {fmt(ars)}
      </p>
      {usd !== 0 && (
        <p className="mt-0.5 text-base font-medium tabular-nums text-zinc-300">
          {fmt(usd, "USD")}
        </p>
      )}
    </div>
  );
}

export default function ResumenTabs({
  gastos,
  ingresos,
  ahorros,
  saldos,
  fijoArs,
  variableArs,
  gastosDetalle,
}: Props) {
  const [tab, setTab] = React.useState<TabKey>("gastos");

  const gastoMetas = React.useMemo(() => metaMap(gastoCategorias), []);
  const ingresoMetas = React.useMemo(() => metaMap(ingresoCategorias), []);
  const ahorroMetas = React.useMemo(() => metaMap(ahorroCategorias), []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-400 transition aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {tab === "gastos" && (
          <>
            <Hero
              label="Gastado en el período"
              ars={gastos.totalArs}
              usd={gastos.totalUsd}
              accent="#FCA5A5"
              icon={<TrendingDown className="size-4" />}
            />
            {(fijoArs > 0 || variableArs > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-zinc-400">Variables</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {fmt(variableArs)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-zinc-400">Fijos</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {fmt(fijoArs)}
                  </p>
                </div>
              </div>
            )}
            <CategoryBars
              data={gastos}
              metas={gastoMetas}
              emptyText="No hay gastos en el período."
            />
            <GastoDetalle items={gastosDetalle} metas={gastoMetas} />
          </>
        )}

        {tab === "disponible" && (
          <>
            <p className="text-sm text-zinc-400">
              Plata disponible en cada origen (entradas menos gastos
              descontados).
            </p>
            <div className="flex flex-col gap-3">
              {origenes.map((o) => {
                const s = saldos[o.slug] ?? { ars: 0, usd: 0 };
                return (
                  <div
                    key={o.slug}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${o.color}1f`,
                        color: o.color,
                      }}
                    >
                      {o.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white">
                        {o.title}
                      </h3>
                      <p
                        className="mt-0.5 text-sm tabular-nums"
                        style={{ color: s.ars < 0 ? "#FCA5A5" : "#d4d4d8" }}
                      >
                        {montoLabel(s.ars, s.usd)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "ahorros" && (
          <>
            <Hero
              label="Ahorro acumulado (total)"
              ars={ahorros.totalArs}
              usd={ahorros.totalUsd}
              accent="#C4B5FD"
              icon={<PiggyBank className="size-4" />}
            />
            <CategoryBars
              data={ahorros}
              metas={ahorroMetas}
              emptyText="Todavía no hay ahorros."
            />
          </>
        )}

        {tab === "ingresos" && (
          <>
            <Hero
              label="Ingresos en el período"
              ars={ingresos.totalArs}
              usd={ingresos.totalUsd}
              accent="#86EFAC"
              icon={<TrendingUp className="size-4" />}
            />
            <CategoryBars
              data={ingresos}
              metas={ingresoMetas}
              emptyText="No hay ingresos en el período."
            />
          </>
        )}
      </div>
    </div>
  );
}
