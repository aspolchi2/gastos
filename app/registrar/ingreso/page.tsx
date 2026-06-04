import { redirect } from "next/navigation";
import { auth } from "@/auth";
import IngresoForm from "@/components/registrar/IngresoForm";

export default async function RegistrarIngresoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <IngresoForm />;
}
