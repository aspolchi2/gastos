"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  /** Día inicial del rango aplicado, en formato yyyy-MM-dd. */
  from: string;
  /** Último día (inclusive) del rango aplicado, en formato yyyy-MM-dd. */
  to: string;
  /** Etiqueta legible del rango aplicado (ej. "junio 2026"). */
  label: string;
};

function fmtDay(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function ResumenRangePicker({ from, to, label }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: parseISO(from),
    to: parseISO(to),
  });

  // Navega al mismo /resumen con el rango en la URL: el Server Component
  // re-corre las agregaciones con las fechas nuevas (sin fetch en cliente).
  const navegar = (desde: Date, hasta: Date) => {
    router.push(`/resumen?desde=${fmtDay(desde)}&hasta=${fmtDay(hasta)}`);
    setOpen(false);
  };

  const aplicar = () => {
    if (range?.from) navegar(range.from, range.to ?? range.from);
  };

  const preset = (desde: Date, hasta: Date) => {
    setRange({ from: desde, to: hasta });
    navegar(desde, hasta);
  };

  const hoy = new Date();
  const mesPasado = subMonths(hoy, 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 justify-start gap-2 px-3 font-normal text-foreground capitalize",
        )}
      >
        <CalendarIcon className="size-4 opacity-70" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
          <button
            type="button"
            onClick={() => preset(startOfMonth(hoy), endOfMonth(hoy))}
            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            Este mes
          </button>
          <button
            type="button"
            onClick={() =>
              preset(startOfMonth(mesPasado), endOfMonth(mesPasado))
            }
            className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            Mes pasado
          </button>
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={es}
          defaultMonth={range?.from}
          autoFocus
        />
        <div className="flex justify-end gap-2 border-t border-white/10 p-3">
          <Button
            type="button"
            size="sm"
            onClick={aplicar}
            disabled={!range?.from}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
