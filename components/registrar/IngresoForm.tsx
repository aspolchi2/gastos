"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import CategoriaCard from "@/components/registrar/CategoriaCard";
import MontoInput, { type Moneda } from "@/components/registrar/MontoInput";
import { ingresoCategorias } from "@/lib/data";

const STEPS = ["tipo", "datos"] as const;

const TITULOS: Record<(typeof STEPS)[number], string> = {
  tipo: "Tipo de Ingreso",
  datos: "Registrar ingreso",
};

type Status = "idle" | "loading" | "success" | "error";

export default function IngresoForm() {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState(0);
  const [fecha, setFecha] = React.useState<Date | undefined>(() => new Date());
  const [monto, setMonto] = React.useState(0);
  const [moneda, setMoneda] = React.useState<Moneda>("ARS");
  const [categoria, setCategoria] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Cerramos el teclado al cambiar de paso y volvemos el scroll al tope.
    (document.activeElement as HTMLElement | null)?.blur();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const paso = STEPS[step];

  const datosValidos = Boolean(fecha) && monto > 0;

  const handleBack = () => {
    if (step === 0) {
      router.push("/");
    } else {
      setStep((s) => s - 1);
    }
  };

  // Al elegir el tipo de ingreso pasamos al paso del monto.
  const handleSelectCategoria = (slug: string) => {
    setCategoria(slug);
    setStep((s) => s + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paso === "datos" && datosValidos) {
      handleGuardar();
    }
  };

  const handleGuardar = async () => {
    if (!fecha || !categoria) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/ingresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          monto,
          moneda,
          categoria,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo guardar el ingreso");
      }
      setStatus("success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const guardando = status === "loading" || status === "success";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto"
      >
        <header>
          <h1 className="text-2xl font-bold">{TITULOS[paso]}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paso {step + 1} de {STEPS.length}
          </p>
        </header>

        {paso === "tipo" && (
          <div className="flex flex-col gap-3">
            {ingresoCategorias.map((cat) => (
              <CategoriaCard
                key={cat.slug}
                {...cat}
                selected={categoria === cat.slug}
                onSelect={handleSelectCategoria}
              />
            ))}
          </div>
        )}

        {paso === "datos" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha">Fecha</Label>
              <DatePicker id="fecha" value={fecha} onChange={setFecha} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Monto</Label>
              <MontoInput
                value={monto}
                onChange={setMonto}
                moneda={moneda}
                onMonedaChange={setMoneda}
              />
            </div>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-white/10 pt-4">
        {status === "error" && error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-foreground"
            onClick={handleBack}
            disabled={guardando}
          >
            Atrás
          </Button>

          {paso === "datos" && (
            <Button
              type="submit"
              className="flex-1"
              disabled={!datosValidos || guardando}
            >
              {status === "loading" && <Loader2 className="size-4 animate-spin" />}
              {status === "success" && <Check className="size-4" />}
              {status === "loading"
                ? "Guardando…"
                : status === "success"
                  ? "Guardado"
                  : status === "error"
                    ? "Reintentar"
                    : "Guardar"}
            </Button>
          )}
        </div>
      </footer>
    </form>
  );
}
