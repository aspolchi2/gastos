"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LineChart, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import CategoriaCard from "@/components/registrar/CategoriaCard";
import { gastosVariables, gastosFijos } from "@/lib/data";

const STEPS = ["fecha", "tipo", "monto"] as const;

type TipoGasto = "variable" | "fijo";

export default function GastoForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [fecha, setFecha] = React.useState<Date | undefined>(() => new Date());
  const [tipo, setTipo] = React.useState<TipoGasto>("variable");
  const [categoria, setCategoria] = React.useState<string | null>(null);

  const handleBack = () => {
    if (step === 0) {
      router.push("/");
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
    // TODO: en el último paso, guardar el gasto.
  };

  const handleSelectCategoria = (slug: string) => {
    setCategoria(slug);
    setStep((s) => s + 1);
  };

  const categorias = tipo === "variable" ? gastosVariables : gastosFijos;

  const canContinue = STEPS[step] === "fecha" ? Boolean(fecha) : true;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-2xl font-bold">
            {STEPS[step] === "tipo" ? "Tipo de Gasto" : "Registrar gasto"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paso {step + 1} de {STEPS.length}
          </p>
        </header>

        {STEPS[step] === "fecha" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha">Fecha</Label>
            <DatePicker id="fecha" value={fecha} onChange={setFecha} />
          </div>
        )}

        {STEPS[step] === "tipo" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setTipo("variable")}
                aria-pressed={tipo === "variable"}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition aria-pressed:bg-white/10 aria-pressed:text-white"
              >
                <LineChart className="size-4" />
                Variable
              </button>
              <button
                type="button"
                onClick={() => setTipo("fijo")}
                aria-pressed={tipo === "fijo"}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition aria-pressed:bg-white/10 aria-pressed:text-white"
              >
                <Home className="size-4" />
                Fijo
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {categorias.map((cat) => (
                <CategoriaCard
                  key={cat.slug}
                  {...cat}
                  selected={categoria === cat.slug}
                  onSelect={handleSelectCategoria}
                />
              ))}
            </div>
          </div>
        )}

        {STEPS[step] === "monto" && (
          <p className="text-sm text-zinc-400">
            Próximamente: monto del gasto.
          </p>
        )}
      </div>

      <footer className="flex shrink-0 gap-3 border-t border-white/10 pt-4">
        <Button
          variant="outline"
          className="flex-1 text-foreground"
          onClick={handleBack}
        >
          Atrás
        </Button>
        {STEPS[step] !== "tipo" && (
          <Button
            className="flex-1"
            onClick={handleNext}
            disabled={!canContinue}
          >
            Siguiente
          </Button>
        )}
      </footer>
    </main>
  );
}
