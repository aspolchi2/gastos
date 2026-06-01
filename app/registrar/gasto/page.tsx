import { redirect } from "next/navigation";
import { auth } from "@/auth";
import GastoForm from "@/components/registrar/GastoForm";

export default async function RegistrarGastoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <GastoForm />;
}
