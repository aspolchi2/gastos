import {
  format,
  parse,
  isValid,
  startOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";

// Resuelve el rango [start, end) a partir de los search params. `end` es
// exclusivo (inicio del día siguiente al último día elegido). Sin params
// válidos, cae al mes en curso.
export function resolverRango(desde?: string, hasta?: string) {
  const d = desde ? parse(desde, "yyyy-MM-dd", new Date()) : null;
  const h = hasta ? parse(hasta, "yyyy-MM-dd", new Date()) : null;
  if (d && h && isValid(d) && isValid(h) && d <= h) {
    return { start: startOfDay(d), end: addDays(startOfDay(h), 1) };
  }
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: startOfDay(addDays(endOfMonth(now), 1)),
  };
}

// Etiqueta legible: "junio 2026" si el rango es un mes completo, si no
// "1 jun – 15 jul".
export function rangoLabel(start: Date, end: Date) {
  const lastDay = addDays(end, -1);
  const esMesCompleto =
    start.getDate() === 1 &&
    lastDay.getTime() === endOfMonth(start).setHours(0, 0, 0, 0) &&
    start.getMonth() === lastDay.getMonth();
  if (esMesCompleto) return format(start, "MMMM yyyy", { locale: es });
  const mismoAnio = start.getFullYear() === lastDay.getFullYear();
  return `${format(start, "d MMM", { locale: es })} – ${format(
    lastDay,
    mismoAnio ? "d MMM" : "d MMM yyyy",
    { locale: es },
  )}`;
}
