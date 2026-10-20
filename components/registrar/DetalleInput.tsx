"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DETALLE_MAX } from "@/lib/format";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Texto libre opcional que acompaña al movimiento ("verdulería", "regalo de
// cumple"). Se muestra en la lista, el resumen, el Excel y la planilla.
export default function DetalleInput({
  value,
  onChange,
  placeholder = "Ej: verdulería, regalo de cumple",
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="detalle">
        Detalle <span className="font-normal text-zinc-500">(opcional)</span>
      </Label>
      <Input
        id="detalle"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={DETALLE_MAX}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="done"
        // 16px en mobile para que iOS no haga zoom al enfocar.
        className="h-11 px-3 text-base"
      />
    </div>
  );
}
