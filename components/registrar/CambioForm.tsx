"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import MontoInput from "@/components/registrar/MontoInput";
import type { Saldo } from "@/app/utils/saldos";

type Direccion = "usd-ars" | "ars-usd";
type Status = "idle" | "loading" | "success" | "error";

const TABS: { key: Direccion; label: string }[] = [
  { key: "usd-ars", label: "Dólares a pesos" },
  { key: "ars-usd", label: "Pesos a dólares" },
];

function fmt(cents: number, currency: "ARS" | "USD") {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency });
}

export default function CambioForm({ saldo }: { saldo: Saldo }) {
  const router = useRouter();
  const [direccion, setDireccion] = React.useState<Direccion>("usd-ars");
  const [fecha, setFecha] = React.useState<Date | undefined>(() => new Date());
  const [usd, setUsd] = React.useState(0);
  const [precio, setPrecio] = React.useState(0);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const totalArs = Math.round((usd * precio) / 100);
  const valido = Boolean(fecha) && usd > 0 && precio > 0;
  const guardando = status === "loading" || status === "success";

  const handleGuardar = async () => {
    if (!fecha || !valido) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/cambios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString(),
          direccion,
          usd,
          precio,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo registrar el cambio");
      }
      setStatus("success");
      setTimeout(() => router.push("/resumen"), 1000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleGuardar();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-2xl font-bold">Cambio de divisas</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {direccion === "usd-ars"
              ? `Disponible en dólares: ${fmt(saldo.usd, "USD")}`
              : `Disponible en pesos: ${fmt(saldo.ars, "ARS")}`}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setDireccion(t.key)}
              aria-pressed={direccion === t.key}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition aria-pressed:bg-white/10 aria-pressed:text-white"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha">Fecha</Label>
          <DatePicker id="fecha" value={fecha} onChange={setFecha} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Cantidad de dólares</Label>
          <MontoInput value={usd} onChange={setUsd} symbol="US$" />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Precio del dólar (ARS)</Label>
          <MontoInput value={precio} onChange={setPrecio} symbol="$" />
        </div>

        {valido && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <ArrowRightLeft className="size-4" />
              {direccion === "usd-ars" ? "Vendés" : "Comprás"}{" "}
              {fmt(usd, "USD")}
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">
              {direccion === "usd-ars" ? "Recibís " : "Pagás "}
              {fmt(totalArs, "ARS")}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {direccion === "usd-ars"
                ? `Se descuentan ${fmt(usd, "USD")} de tu saldo en dólares y se suman ${fmt(totalArs, "ARS")} a pesos.`
                : `Se descuentan ${fmt(totalArs, "ARS")} de pesos y se suman ${fmt(usd, "USD")} a tu saldo en dólares.`}
            </p>
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
            onClick={() => router.push("/registrar/ingreso")}
            disabled={guardando}
          >
            Atrás
          </Button>
          <Button type="submit" className="flex-1" disabled={!valido || guardando}>
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
        </div>
      </footer>
    </form>
  );
}
