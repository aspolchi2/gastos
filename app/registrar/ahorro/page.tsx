import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AhorroForm from "@/components/registrar/AhorroForm";

export default async function RegistrarAhorroPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <AhorroForm />;
}
