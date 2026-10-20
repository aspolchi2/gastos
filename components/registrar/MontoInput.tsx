"use client";

import * as React from "react";
import Segmented from "@/components/ui/Segmented";

export type Moneda = "ARS" | "USD";

type MontoInputProps = {
  /** Monto en centavos. */
  value: number;
  onChange: (cents: number) => void;
  /** En pesos se cargan enteros (sin centavos); en dólares, con centavos. */
  moneda?: Moneda;
  /** Si se omite, no se muestra el selector de moneda. */
  onMonedaChange?: (moneda: Moneda) => void;
  /** Símbolo que precede al número (por defecto "$"). */
  symbol?: string;
};

function formatCents(cents: number, moneda: Moneda) {
  const decimales = moneda === "ARS" ? 0 : 2;
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

const MONEDAS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
] as const;

const MontoInput = ({
  value,
  onChange,
  moneda = "ARS",
  onMonedaChange,
  symbol = "$",
}: MontoInputProps) => {
  const sinCentavos = moneda === "ARS";
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayRef = React.useRef<HTMLButtonElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, sinCentavos ? 10 : 12);
    const n = digits ? parseInt(digits, 10) : 0;
    // Siempre devolvemos centavos: en pesos lo tipeado son pesos enteros.
    onChange(sinCentavos ? n * 100 : n);
  };

  // Al pasar a pesos descartamos los centavos que pudiera tener el monto.
  const handleMonedaChange = (m: Moneda) => {
    if (m === "ARS" && value % 100 !== 0) onChange(Math.round(value / 100) * 100);
    onMonedaChange?.(m);
  };

  const digitos = sinCentavos ? Math.floor(value / 100) : value;

  // El input real es invisible, así que el navegador no lo trae a la vista al
  // abrir el teclado. Llevamos el número visible al área visible una vez que el
  // viewport se reacomodó tras aparecer el teclado.
  const scrollIntoView = () => {
    window.setTimeout(() => {
      displayRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 300);
  };

  return (
    <div className="flex flex-col gap-6">
      {onMonedaChange && (
        <Segmented
          aria-label="Moneda"
          value={moneda}
          onChange={handleMonedaChange}
          options={MONEDAS}
        />
      )}

      <button
        ref={displayRef}
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="flex items-end justify-center gap-2 border-b border-white/15 pb-3 transition-colors duration-150 focus-within:border-white/50"
      >
        <span className="text-3xl font-light text-zinc-400">{symbol}</span>
        <span className="text-5xl font-light tabular-nums tracking-tight text-white">
          {formatCents(value, moneda)}
        </span>
        <input
          ref={inputRef}
          value={digitos ? String(digitos) : ""}
          onChange={handleChange}
          onFocus={scrollIntoView}
          inputMode="numeric"
          enterKeyHint="next"
          aria-label="Monto"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </button>
    </div>
  );
};

export default MontoInput;
