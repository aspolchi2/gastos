// Convención de fechas: un movimiento es de un *día calendario*, no de un
// instante. Se guarda como medianoche UTC de ese día (2026-06-09T00:00:00Z) y
// se lee siempre con getters UTC, así no se corre según la zona horaria del
// server (Vercel = UTC) ni del navegador (AR = UTC-3).

const TZ_AR = "America/Argentina/Buenos_Aires";
const DIA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

/** "yyyy-MM-dd" del día que el usuario ve en su calendario (hora local). */
export function aDia(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "yyyy-MM-dd" de una fecha guardada (medianoche UTC). */
export function diaUTC(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Medianoche UTC del día indicado. */
export function utcDia(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

/**
 * Parsea la fecha que manda el cliente a medianoche UTC. Acepta "yyyy-MM-dd"
 * y, por compatibilidad con PWAs con el JS viejo cacheado, un ISO completo, al
 * que le tomamos el día calendario en Argentina. Devuelve null si es inválida.
 */
export function parseDia(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const m = DIA_RE.exec(s);
  if (m) {
    const d = utcDia(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return diaUTC(d) === s ? d : null;
  }
  const instante = new Date(s);
  if (Number.isNaN(instante.getTime())) return null;
  const { year, month, day } = partesArgentina(instante);
  return utcDia(year, month - 1, day);
}

/** Partes de calendario (mes 1-12) de un instante, en hora de Argentina. */
export function partesArgentina(instante = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_AR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante);
  const get = (t: string) => Number(partes.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Fecha local con el mismo día calendario que una fecha guardada en UTC, para
 * pasarla a date-fns `format` (que usa hora local) sin correr el día.
 */
export function comoLocal(d: Date) {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
