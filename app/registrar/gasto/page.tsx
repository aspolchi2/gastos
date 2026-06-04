import { redirect } from "next/navigation";
import { auth } from "@/auth";
import GastoForm from "@/components/registrar/GastoForm";
import { getOrigenSaldos } from "@/app/utils/saldos";

export const dynamic = "force-dynamic";

export default async function RegistrarGastoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const saldos = await getOrigenSaldos();

  return <GastoForm saldos={saldos} />;
}
