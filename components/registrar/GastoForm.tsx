"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LineChart, Home, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import CategoriaCard from "@/components/registrar/CategoriaCard";
import MontoInput, { type Moneda } from "@/components/registrar/MontoInput";
import { gastosVariables, gastosFijos, origenes } from "@/lib/data";

const STEPS = ["datos", "tipo", "origen"] as const;

const TITULOS: Record<(typeof STEPS)[number], string> = {
  datos: "Registrar gasto",
  tipo: "Tipo de Gasto",
  origen: "Origen",
};

type TipoGasto = "variable" | "fijo";
type Status = "idle" | "loading" | "success" | "error";

export default function GastoForm() {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState(0);
  const [fecha, setFecha] = React.useState<Date | undefined>(() => new Date());
  const [monto, setMonto] = React.useState(0);
  const [moneda, setMoneda] = React.useState<Moneda>("ARS");
  const [tipo, setTipo] = React.useState<TipoGasto>("variable");
  const [categoria, setCategoria] = React.useState<string | null>(null);
  const [origen, setOrigen] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Cerramos el teclado al cambiar de paso y volvemos el scroll al tope.
    (document.activeElement as HTMLElement | null)?.blur();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const paso = STEPS[step];

  const categorias = tipo === "variable" ? gastosVariables : gastosFijos;

  const datosValidos = Boolean(fecha) && monto > 0;

  const handleBack = () => {
    if (step === 0) {
      router.push("/");
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // El único "Siguiente" avanza desde el paso de datos (monto).
    if (paso === "datos" && datosValidos) {
      setStep((s) => s + 1);
    }
  };

  // Al elegir una categoría se pasa directamente al siguiente paso.
  const handleSelectCategoria = (slug: string) => {
    setCategoria(slug);
    setStep((s) => s + 1);
  };

  const handleGuardar = async () => {
    if (!fecha || !categoria || !origen) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          monto,
          moneda,
          tipo,
          categoria,
          origen,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo guardar el gasto");
      }
      setStatus("success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

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

        {paso === "tipo" && (
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

        {paso === "origen" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400">
              ¿De dónde se descuenta la plata?
            </p>
            {origenes.map((o) => (
              <CategoriaCard
                key={o.slug}
                {...o}
                selected={origen === o.slug}
                onSelect={setOrigen}
              />
            ))}
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
            disabled={status === "loading" || status === "success"}
          >
            Atrás
          </Button>

          {paso === "datos" && (
            <Button type="submit" className="flex-1" disabled={!datosValidos}>
              Siguiente
            </Button>
          )}

          {paso === "origen" && (
            <Button
              type="button"
              className="flex-1"
              onClick={handleGuardar}
              disabled={!origen || status === "loading" || status === "success"}
            >
              {status === "loading" && (
                <Loader2 className="size-4 animate-spin" />
              )}
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
