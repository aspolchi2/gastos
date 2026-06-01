import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center  font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl  px-8 py-12 dark:bg-black">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-foreground text-background px-4 py-2 text-sm"
          >
            Iniciar sesión con Google
          </button>
        </form>
      </main>
    </div>
  );
}
