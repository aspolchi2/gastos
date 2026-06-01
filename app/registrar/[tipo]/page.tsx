import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { registrar } from "@/lib/data";
import type { RegistroTipo } from "@/lib/types";

const TIPOS: RegistroTipo[] = ["gasto", "ingreso", "ahorro"];

export default async function RegistrarTipoPage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { tipo } = await params;
  if (!TIPOS.includes(tipo as RegistroTipo)) {
    notFound();
  }

  const item = registrar.find((r) => r.href === `/registrar/${tipo}`)!;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 active:scale-95"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold">Registrar {item.title.toLowerCase()}</h1>
      </div>

      <p className="text-sm text-zinc-400">
        Próximamente: formulario para cargar un {item.title.toLowerCase()}.
      </p>
    </main>
  );
}
