import Link from "next/link";
import { redirect } from "next/navigation";
import { ChartColumn, ChevronRight, ListOrdered } from "lucide-react";
import { auth } from "@/auth";
import TabCard from "@/components/ui/TabCard";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import EnableNotifications from "@/components/pwa/EnableNotifications";
import { registrar } from "@/lib/data";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col gap-6 ">
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

      <Link
        href="/resumen"
        className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition active:scale-[0.98]"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "#C4B5FD1f", color: "#C4B5FD" }}
        >
          <ChartColumn />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">Ver resumen</h3>
          <p className="mt-0.5 text-sm text-zinc-400">Gastos por categoría.</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-zinc-500" />
      </Link>

      <Link
        href="/movimientos"
        className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition active:scale-[0.98]"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "#7DD3FC1f", color: "#7DD3FC" }}
        >
          <ListOrdered />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">Movimientos</h3>
          <p className="mt-0.5 text-sm text-zinc-400">
            Ver y borrar lo cargado.
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-zinc-500" />
      </Link>

      <EnableNotifications />
      <InstallPrompt />
    </main>
  );
}
