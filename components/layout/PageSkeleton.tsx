import { ArrowLeft } from "lucide-react";

// Esqueleto mientras el Server Component consulta la base: mismo encabezado
// que la página real para que no salte nada al llegar los datos.
export default function PageSkeleton({
  title,
  blocks,
}: {
  title: string;
  blocks: string[];
}) {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5" aria-busy>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10">
          <ArrowLeft className="size-5" />
        </span>
        <h1 className="flex-1 text-2xl font-bold">{title}</h1>
        <span className="h-10 w-32 animate-pulse rounded-md bg-white/5" />
      </div>
      {blocks.map((h, i) => (
        <div
          key={i}
          className={`${h} animate-pulse rounded-xl border border-white/5 bg-white/5`}
        />
      ))}
    </main>
  );
}
