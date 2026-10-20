import { redirect } from "next/navigation";
import { ChartColumn, ListOrdered } from "lucide-react";
import { auth } from "@/auth";
import TabCard from "@/components/ui/TabCard";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import EnableNotifications from "@/components/pwa/EnableNotifications";
import { registrar } from "@/lib/data";
import clientPromise from "@/app/utils/mongodb";
import { resolverRango } from "@/app/utils/rango";

export const dynamic = "force-dynamic";

type TotalRow = { _id: "ARS" | "USD"; total: number };

// Total gastado en el mes en curso, por moneda (centavos).
async function gastadoEsteMes() {
  const { start, end } = resolverRango();
  const client = await clientPromise;
  const rows = await client
    .db("gastos")
    .collection("gastos")
    .aggregate<TotalRow>([
      { $match: { fecha: { $gte: start, $lt: end } } },
      { $group: { _id: "$moneda", total: { $sum: "$monto" } } },
    ])
    .toArray();
  const ars = rows.find((r) => r._id === "ARS")?.total ?? 0;
  const usd = rows.find((r) => r._id === "USD")?.total ?? 0;
  return { ars, usd };
}

function fmt(cents: number, currency: "ARS" | "USD") {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency });
}

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Si la base falla, la home sigue sirviendo para cargar movimientos.
  const mes = await gastadoEsteMes().catch(() => null);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-2">
      <div>
        <h1 className="text-2xl font-bold">¿Qué querés registrar?</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Elegí una opción para continuar.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {registrar.map((item) => (
          <TabCard key={item.href} {...item} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-medium text-zinc-400">Consultar</h2>
        <TabCard
          href="/resumen"
          title="Resumen"
          description={
            mes ? "Gastado este mes" : "Gastos por categoría."
          }
          icon={<ChartColumn />}
          color="#A1A1AA"
          aside={
            mes && (
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-white">
                {fmt(mes.ars, "ARS")}
                {mes.usd !== 0 && (
                  <span className="block text-xs font-normal text-zinc-400">
                    {fmt(mes.usd, "USD")}
                  </span>
                )}
              </span>
            )
          }
        />
        <TabCard
          href="/movimientos"
          title="Movimientos"
          description="Ver y borrar lo cargado."
          icon={<ListOrdered />}
          color="#A1A1AA"
        />
      </div>

      <EnableNotifications />
      <InstallPrompt />
    </main>
  );
}
