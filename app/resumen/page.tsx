import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { gastoCategorias } from "@/lib/data";

export const dynamic = "force-dynamic";

type Row = { _id: string; total: number; count: number };

function formatMonto(cents: number) {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default async function ResumenPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const client = await clientPromise;
  const rows = await client
    .db("gastos")
    .collection("gastos")
    .aggregate<Row>([
      { $match: { moneda: "ARS" } },
      {
        $group: {
          _id: "$categoria",
          total: { $sum: "$monto" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ])
    .toArray();

  const catMap = new Map(gastoCategorias.map((c) => [c.slug, c]));
  const total = rows.reduce((acc, r) => acc + r.total, 0);
  const max = rows.reduce((acc, r) => Math.max(acc, r.total), 0);

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
        <h1 className="text-2xl font-bold">Resumen</h1>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-zinc-400">Total gastado</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatMonto(total)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">Todavía no hay gastos cargados.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {rows.map((row) => {
            const cat = catMap.get(row._id);
            const color = cat?.color ?? "#93C5FD";
            const pct = max > 0 ? Math.round((row.total / max) * 100) : 0;
            return (
              <div key={row._id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-white">
                    {cat?.title ?? row._id}
                  </span>
                  <span className="text-sm tabular-nums text-zinc-300">
                    {formatMonto(row.total)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
