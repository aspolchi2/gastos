import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CambioForm from "@/components/registrar/CambioForm";
import { getOrigenSaldos } from "@/app/utils/saldos";

export const dynamic = "force-dynamic";

export default async function RegistrarCambioPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // El sueldo en dólares y los pesos disponibles viven en el pozo de ingresos
  // mensuales.
  const saldos = await getOrigenSaldos();
  const saldo = saldos["ingresos-mensuales"] ?? { ars: 0, usd: 0 };

  return <CambioForm saldo={saldo} />;
}
