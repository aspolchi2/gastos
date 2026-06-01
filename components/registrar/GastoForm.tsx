"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

const STEPS = ["fecha", "monto"] as const;

export default function GastoForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [fecha, setFecha] = React.useState<Date | undefined>(() => new Date());

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

  const canContinue = STEPS[step] === "fecha" ? Boolean(fecha) : true;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-2xl font-bold">Registrar gasto</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paso {step + 1} de {STEPS.length}
          </p>
        </header>

        <div className="flex flex-col gap-2">
          {STEPS[step] === "fecha" && (
            <>
              <Label htmlFor="fecha">Fecha</Label>
              <DatePicker id="fecha" value={fecha} onChange={setFecha} />
            </>
          )}

          {STEPS[step] === "monto" && (
            <p className="text-sm text-zinc-400">
              Próximamente: monto del gasto.
            </p>
          )}
        </div>
      </div>

      <footer className="flex shrink-0 gap-3 border-t border-white/10 pt-4">
        <Button
          variant="outline"
          className="flex-1 text-foreground"
          onClick={handleBack}
        >
          Atrás
        </Button>
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={!canContinue}
        >
          Siguiente
        </Button>
      </footer>
    </main>
  );
}
