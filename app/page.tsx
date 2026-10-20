import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChartColumn, ListOrdered } from "lucide-react";
import { auth } from "@/auth";
import TabCard from "@/components/ui/TabCard";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import EnableNotifications from "@/components/pwa/EnableNotifications";
import { registrar } from "@/lib/data";
import clientPromise from "@/app/utils/mongodb";
import { resolverRango } from "@/app/utils/rango";
import { formatMonto } from "@/lib/format";
import { getMovimientosPlanilla } from "@/app/utils/resumenPlanilla";

export const dynamic = "force-dynamic";

type TotalRow = { _id: "ARS" | "USD"; total: number };

// Total gastado en el mes en curso, por moneda (centavos). Sale de la planilla
// para coincidir con el resumen; si no responde, de lo cargado en la app.
async function gastadoEsteMes() {
  const { start, end } = resolverRango();
  try {
    const movs = await getMovimientosPlanilla(start, end);
    const sum = (moneda: "ARS" | "USD") =>
      movs
        .filter((m) => m.clase === "Gasto" && m.moneda === moneda)
        .reduce((a, m) => a + m.monto, 0);
    return { ars: sum("ARS"), usd: sum("USD") };
  } catch {
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
}

// Monto del mes a la derecha de la tarjeta. Va en Suspense: la home no espera
// a la planilla para mostrarse.
async function GastadoMes() {
  const mes = await gastadoEsteMes().catch(() => null);
  if (!mes) return null;
  return (
    <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-white">
      {formatMonto(mes.ars, "ARS")}
      {mes.usd !== 0 && (
        <span className="block text-xs font-normal text-zinc-400">
          {formatMonto(mes.usd, "USD")}
        </span>
      )}
    </span>
  );
}

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

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
          description="Este mes"
          icon={<ChartColumn />}
          color="#A1A1AA"
          aside={
            <Suspense
              fallback={
                <span className="h-5 w-20 shrink-0 animate-pulse rounded bg-white/10" />
              }
            >
              <GastadoMes />
            </Suspense>
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
