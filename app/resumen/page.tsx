import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { diaUTC } from "@/lib/fecha";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { getOrigenSaldos } from "@/app/utils/saldos";
import { getMovimientos, type Movimiento } from "@/app/utils/movimientos";
import { getMovimientosPlanilla } from "@/app/utils/resumenPlanilla";
import { resolverRango, rangoLabel } from "@/app/utils/rango";
import ResumenRangePicker from "@/components/resumen/ResumenRangePicker";
import ResumenTabs, {
  type CatTotal,
  type TabData,
} from "@/components/resumen/ResumenTabs";
import { formatMonto } from "@/lib/format";

export const dynamic = "force-dynamic";

type CatRow = { _id: { categoria?: string; moneda: "ARS" | "USD" }; total: number };

function movsToTab(movs: Movimiento[]): TabData {
  return aggToTab(
    movs.map((m) => ({
      _id: { categoria: m.categoria, moneda: m.moneda },
      total: m.monto,
    })),
  );
}

function aggToTab(rows: CatRow[]): TabData {
  const map = new Map<string, CatTotal>();
  for (const r of rows) {
    const slug = r._id.categoria ?? "otros";
    const e = map.get(slug) ?? { slug, ars: 0, usd: 0 };
    if (r._id.moneda === "USD") e.usd += r.total;
    else e.ars += r.total;
    map.set(slug, e);
  }
  const items = [...map.values()].sort((a, b) => b.ars - a.ars);
  const totalArs = items.reduce((a, i) => a + i.ars, 0);
  const totalUsd = items.reduce((a, i) => a + i.usd, 0);
  return { items, totalArs, totalUsd };
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { desde, hasta } = await searchParams;
  const { start, end } = resolverRango(desde, hasta);
  const client = await clientPromise;
  const db = client.db("gastos");

  // Gastos e ingresos salen de la planilla (tiene también lo cargado por el bot
  // y a mano). Si no responde, caemos a lo cargado en la app. Ahorros y
  // saldos por origen solo existen en la app.
  const [planilla, ahorrosRows, saldos] = await Promise.all([
    getMovimientosPlanilla(start, end).catch((error) => {
      console.error("Resumen: no se pudo leer la planilla", error);
      return null;
    }),
    // Ahorros: acumulado de todos los tiempos, sin filtrar por el rango.
    db
      .collection("ahorros")
      .aggregate<CatRow>([
        {
          $group: {
            _id: { categoria: "$categoria", moneda: "$moneda" },
            total: { $sum: "$monto" },
          },
        },
      ])
      .toArray(),
    getOrigenSaldos(),
  ]);
  const movimientos = planilla ?? (await getMovimientos(start, end));
  const fuente = planilla ? "planilla" : "app";

  const gastosMovs = movimientos.filter((m) => m.clase === "Gasto");
  const gastos = movsToTab(gastosMovs);
  const ingresos = movsToTab(movimientos.filter((m) => m.clase === "Ingreso"));
  const ahorros = aggToTab(ahorrosRows);

  // Detalle de gastos individuales, más recientes primero, para el listado por
  // día dentro de la pestaña Gastos.
  const gastosDetalle = [...gastosMovs].sort(
    (a, b) => b.fecha.getTime() - a.fecha.getTime(),
  );

  // Desglose fijo/variable de gastos (solo ARS para la barra).
  let fijoArs = 0;
  let variableArs = 0;
  for (const m of gastosMovs) {
    if (m.moneda !== "ARS") continue;
    if (m.tipo === "fijo") fijoArs += m.monto;
    else if (m.tipo === "variable") variableArs += m.monto;
  }

  const label = rangoLabel(start, end);
  const balanceArs = ingresos.totalArs - gastos.totalArs;
  const balanceUsd = ingresos.totalUsd - gastos.totalUsd;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver"
          className="pressable flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-bold">Resumen</h1>
        <ResumenRangePicker
          from={diaUTC(start)}
          to={diaUTC(new Date(end.getTime() - 1))}
          label={label}
        />
      </div>

      {fuente === "app" && (
        <p className="-mt-2 text-xs text-amber-300/80">
          No se pudo leer la planilla: se muestra solo lo cargado en la app.
        </p>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Wallet className="size-4" />
          Balance del período (ingresos − gastos)
        </div>
        <p
          className="mt-1 text-3xl font-bold tabular-nums"
          style={{ color: balanceArs < 0 ? "#FCA5A5" : "#86EFAC" }}
        >
          {formatMonto(balanceArs)}
        </p>
        {balanceUsd !== 0 && (
          <p className="mt-0.5 text-base font-medium tabular-nums text-zinc-300">
            {formatMonto(balanceUsd, "USD")}
          </p>
        )}
      </div>

      <ResumenTabs
        gastos={gastos}
        ingresos={ingresos}
        ahorros={ahorros}
        saldos={saldos}
        fijoArs={fijoArs}
        variableArs={variableArs}
        gastosDetalle={gastosDetalle}
      />
    </main>
  );
}
