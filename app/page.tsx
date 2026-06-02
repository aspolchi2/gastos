import { redirect } from "next/navigation";
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

      <EnableNotifications />
      <InstallPrompt />
    </main>
  );
}
