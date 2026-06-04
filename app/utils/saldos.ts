import clientPromise from "@/app/utils/mongodb";
import { origenes } from "@/lib/data";

export type Saldo = { ars: number; usd: number };
/** Saldo neto por origen, indexado por slug. Montos en centavos. */
export type Saldos = Record<string, Saldo>;

type MonedaRow = { _id: "ARS" | "USD"; total: number };
type CategoriaRow = {
  _id: { categoria?: string; origen?: string; moneda: "ARS" | "USD" };
  total: number;
};

// Calcula el saldo neto disponible de cada origen (entradas − gastos),
// agregando todos los movimientos (pozo compartido, sin filtrar por usuario).
export async function getOrigenSaldos(): Promise<Saldos> {
  const client = await clientPromise;
  const db = client.db("gastos");

  const [ingresos, ahorros, gastos] = await Promise.all([
    db
      .collection("ingresos")
      .aggregate<MonedaRow>([
        { $group: { _id: "$moneda", total: { $sum: "$monto" } } },
      ])
      .toArray(),
    db
      .collection("ahorros")
      .aggregate<CategoriaRow>([
        {
          $group: {
            _id: { categoria: "$categoria", moneda: "$moneda" },
            total: { $sum: "$monto" },
          },
        },
      ])
      .toArray(),
    db
      .collection("gastos")
      .aggregate<CategoriaRow>([
        {
          $group: {
            _id: { origen: "$origen", moneda: "$moneda" },
            total: { $sum: "$monto" },
          },
        },
      ])
      .toArray(),
  ]);

  const saldos: Saldos = {};
  for (const o of origenes) saldos[o.slug] = { ars: 0, usd: 0 };

  const add = (slug: string, moneda: "ARS" | "USD", amount: number) => {
    if (!saldos[slug]) saldos[slug] = { ars: 0, usd: 0 };
    if (moneda === "USD") saldos[slug].usd += amount;
    else saldos[slug].ars += amount;
  };

  // Entradas: todos los ingresos van al bucket de ingresos mensuales.
  for (const r of ingresos) add("ingresos-mensuales", r._id, r.total);
  // Entradas: cada ahorro va a su bucket homónimo.
  for (const r of ahorros) add(r._id.categoria!, r._id.moneda, r.total);
  // Salidas: los gastos descuentan de su origen.
  for (const r of gastos) add(r._id.origen!, r._id.moneda, -r.total);

  return saldos;
}
