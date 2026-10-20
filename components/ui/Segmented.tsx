"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type SegmentedProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
};

// Selector de opciones excluyentes con un indicador que se desliza a la opción
// activa. Las opciones ocupan el mismo ancho, así el indicador se posiciona con
// un translateX en porcentaje de su propio ancho (sin medir el DOM).
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={cn(
        "relative grid rounded-xl border border-white/10 bg-white/5 p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-lg bg-white/10 transition-transform duration-200 ease-(--ease-out) motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors duration-150",
              selected ? "text-white" : "text-zinc-400",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
