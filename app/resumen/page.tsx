import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { getOrigenSaldos } from "@/app/utils/saldos";
import ResumenTabs, {
  type CatTotal,
  type TabData,
} from "@/components/resumen/ResumenTabs";

export const dynamic = "force-dynamic";

type CatRow = { _id: { categoria?: string; moneda: "ARS" | "USD" }; total: number };
type TipoRow = { _id: { tipo?: string; moneda: "ARS" | "USD" }; total: number };

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

export default async function ResumenPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
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

  const [gastosRows, ingresosRows, ahorrosRows, gastosTipoRows, saldos] =
    await Promise.all([
      db
        .collection("gastos")
        .aggregate<CatRow>([{ $match: mesMatch }, ...groupCat])
        .toArray(),
      db
        .collection("ingresos")
        .aggregate<CatRow>([{ $match: mesMatch }, ...groupCat])
        .toArray(),
      db
        .collection("ahorros")
        .aggregate<CatRow>([{ $match: mesMatch }, ...groupCat])
        .toArray(),
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
    ]);

  const gastos = aggToTab(gastosRows);
  const ingresos = aggToTab(ingresosRows);
  const ahorros = aggToTab(ahorrosRows);

  // Desglose fijo/variable de gastos (solo ARS para la barra).
  let fijoArs = 0;
  let variableArs = 0;
  for (const r of gastosTipoRows) {
    if (r._id.moneda !== "ARS") continue;
    if (r._id.tipo === "fijo") fijoArs += r.total;
    else if (r._id.tipo === "variable") variableArs += r.total;
  }

  const mesLabel = now.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Resumen</h1>
          <p className="text-sm capitalize text-zinc-400">{mesLabel}</p>
        </div>
      </div>

      <ResumenTabs
        gastos={gastos}
        ingresos={ingresos}
        ahorros={ahorros}
        saldos={saldos}
        fijoArs={fijoArs}
        variableArs={variableArs}
      />
    </main>
  );
}
