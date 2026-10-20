import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  comoLocal,
  parseDia,
  partesArgentina,
  utcDia,
} from "@/lib/fecha";

const DIA_MS = 24 * 60 * 60 * 1000;

// Resuelve el rango [start, end) a partir de los search params, en medianoches
// UTC (igual que se guardan las fechas). `end` es exclusivo (inicio del día
// siguiente al último día elegido). Sin params válidos, cae al mes en curso
// según el calendario de Argentina.
export function resolverRango(desde?: string, hasta?: string) {
  const d = desde ? parseDia(desde) : null;
  const h = hasta ? parseDia(hasta) : null;
  if (d && h && d <= h) {
    return { start: d, end: new Date(h.getTime() + DIA_MS) };
  }
  const { year, month } = partesArgentina();
  return { start: utcDia(year, month - 1, 1), end: utcDia(year, month, 1) };
}

// Etiqueta legible: "junio 2026" si el rango es un mes completo, si no
// "1 jun – 15 jul".
export function rangoLabel(start: Date, end: Date) {
  const lastDay = new Date(end.getTime() - DIA_MS);
  const esMesCompleto =
    start.getUTCDate() === 1 &&
    end.getUTCDate() === 1 &&
    start.getUTCMonth() === lastDay.getUTCMonth() &&
    start.getUTCFullYear() === lastDay.getUTCFullYear();
  const desde = comoLocal(start);
  const hasta = comoLocal(lastDay);
  if (esMesCompleto) return format(desde, "MMMM yyyy", { locale: es });
  const mismoAnio = desde.getFullYear() === hasta.getFullYear();
  return `${format(desde, "d MMM", { locale: es })} – ${format(
    hasta,
    mismoAnio ? "d MMM" : "d MMM yyyy",
    { locale: es },
  )}`;
}
