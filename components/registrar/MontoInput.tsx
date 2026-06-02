"use client";

import * as React from "react";

export type Moneda = "ARS" | "USD";

type MontoInputProps = {
  /** Monto en centavos. */
  value: number;
  onChange: (cents: number) => void;
  moneda: Moneda;
  onMonedaChange: (moneda: Moneda) => void;
};

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONEDAS: Moneda[] = ["ARS", "USD"];

const MontoInput = ({
  value,
  onChange,
  moneda,
  onMonedaChange,
}: MontoInputProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayRef = React.useRef<HTMLButtonElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    onChange(digits ? parseInt(digits, 10) : 0);
  };

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
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
        {MONEDAS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMonedaChange(m)}
            aria-pressed={moneda === m}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            {m}
          </button>
        ))}
      </div>

      <button
        ref={displayRef}
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="flex items-end justify-center gap-2 border-b border-white/15 pb-3"
      >
        <span className="text-3xl font-light text-zinc-400">$</span>
        <span className="text-5xl font-light tabular-nums tracking-tight text-white">
          {formatCents(value)}
        </span>
        <input
          ref={inputRef}
          value={value ? String(value) : ""}
          onChange={handleChange}
          onFocus={scrollIntoView}
          inputMode="numeric"
          aria-label="Monto"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </button>
    </div>
  );
};

export default MontoInput;
