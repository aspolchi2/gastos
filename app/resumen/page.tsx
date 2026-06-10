import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { format, addDays } from "date-fns";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { getOrigenSaldos } from "@/app/utils/saldos";
import { getMovimientos } from "@/app/utils/movimientos";
import { resolverRango, rangoLabel } from "@/app/utils/rango";
import ResumenRangePicker from "@/components/resumen/ResumenRangePicker";
import ResumenTabs, {
  type CatTotal,
  type TabData,
} from "@/components/resumen/ResumenTabs";

export const dynamic = "force-dynamic";

type CatRow = { _id: { categoria?: string; moneda: "ARS" | "USD" }; total: number };
type TipoRow = { _id: { tipo?: string; moneda: "ARS" | "USD" }; total: number };

function fmtMoneda(cents: number, currency: "ARS" | "USD" = "ARS") {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency });
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
  const mesMatch = { fecha: { $gte: start, $lt: end } };

  const client = await clientPromise;
  const db = client.db("gastos");

  const groupCat = [
    {
      $group: {
        _id: { categoria: "$categoria", moneda: "$moneda" },
        total: { $sum: "$monto" },
      },
    },
  ];

  const [
    gastosRows,
    ingresosRows,
    ahorrosRows,
    gastosTipoRows,
    saldos,
    movimientos,
  ] = await Promise.all([
      db
        .collection("gastos")
        .aggregate<CatRow>([{ $match: mesMatch }, ...groupCat])
        .toArray(),
      db
        .collection("ingresos")
        .aggregate<CatRow>([{ $match: mesMatch }, ...groupCat])
        .toArray(),
      // Ahorros: acumulado de todos los tiempos, sin filtrar por el rango.
      db.collection("ahorros").aggregate<CatRow>(groupCat).toArray(),
      db
        .collection("gastos")
        .aggregate<TipoRow>([
          { $match: mesMatch },
          {
            $group: {
              _id: { tipo: "$tipo", moneda: "$moneda" },
              total: { $sum: "$monto" },
            },
          },
        ])
        .toArray(),
      getOrigenSaldos(),
      getMovimientos(start, end),
    ]);

  const gastos = aggToTab(gastosRows);
  const ingresos = aggToTab(ingresosRows);
  const ahorros = aggToTab(ahorrosRows);

  // Detalle de gastos individuales, más recientes primero, para el listado por
  // día dentro de la pestaña Gastos.
  const gastosDetalle = movimientos
    .filter((m) => m.clase === "Gasto")
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  // Desglose fijo/variable de gastos (solo ARS para la barra).
  let fijoArs = 0;
  let variableArs = 0;
  for (const r of gastosTipoRows) {
    if (r._id.moneda !== "ARS") continue;
    if (r._id.tipo === "fijo") fijoArs += r.total;
    else if (r._id.tipo === "variable") variableArs += r.total;
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
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="flex-1 text-2xl font-bold">Resumen</h1>
        <ResumenRangePicker
          from={format(start, "yyyy-MM-dd")}
          to={format(addDays(end, -1), "yyyy-MM-dd")}
          label={label}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Wallet className="size-4" />
          Balance del período (ingresos − gastos)
        </div>
        <p
          className="mt-1 text-3xl font-bold tabular-nums"
          style={{ color: balanceArs < 0 ? "#FCA5A5" : "#86EFAC" }}
        >
          {fmtMoneda(balanceArs)}
        </p>
        {balanceUsd !== 0 && (
          <p className="mt-0.5 text-base font-medium tabular-nums text-zinc-300">
            {fmtMoneda(balanceUsd, "USD")}
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
