import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format, addDays } from "date-fns";
import { auth } from "@/auth";
import { getMovimientos } from "@/app/utils/movimientos";
import { resolverRango, rangoLabel } from "@/app/utils/rango";
import ResumenRangePicker from "@/components/resumen/ResumenRangePicker";
import MovimientosList from "@/components/movimientos/MovimientosList";

export const dynamic = "force-dynamic";

export default async function MovimientosPage({
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
  const movimientos = await getMovimientos(start, end);
  // Más recientes primero para la lista.
  movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  const label = rangoLabel(start, end);

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
        <h1 className="flex-1 text-2xl font-bold">Movimientos</h1>
        <ResumenRangePicker
          from={format(start, "yyyy-MM-dd")}
          to={format(addDays(end, -1), "yyyy-MM-dd")}
          label={label}
          basePath="/movimientos"
        />
      </div>

      <MovimientosList movimientos={movimientos} />
    </main>
  );
}
