import {
  llamar,
  CATEGORIA_PLANILLA,
  INGRESO_PLANILLA,
  planillaConfigurada,
} from "@/app/utils/planilla";
import type { Clase, Movimiento } from "@/app/utils/movimientos";
import { gastoCategorias, ingresoCategoriasConHistoricas } from "@/lib/data";
import { utcDia } from "@/lib/fecha";

// Lee de la planilla los movimientos de un rango para el resumen. La planilla
// es la fuente completa: tiene lo cargado desde la app, el bot y a mano.

type Celda = string | number | boolean | null;
type Respuesta = { anio: number; hojas: { mes: number; filas: Celda[][] }[] };

// Columnas que devuelve la acción "leer" (Tipo … Monto).
const C = { tipo: 0, tipoGasto: 1, dia: 2, anio: 4, descripcion: 5, categoria: 6, presupuesto: 7, monto: 8 };

// Nombre en el desplegable de la planilla → slug de la app (para íconos y colores).
const SLUG_POR_NOMBRE = new Map(
  Object.entries({ ...CATEGORIA_PLANILLA, ...INGRESO_PLANILLA }).map(
    ([slug, nombre]) => [norm(nombre), slug],
  ),
);

// La planilla tiene variantes por moneda como categoría aparte ("Tarjetas
// USD", "Sueldo Ro USD", "Pago de deudas ARS"): las agrupamos con su base.
const sinSufijoMoneda = (nombre: string) => nombre.replace(/\s+(USD|ARS)$/i, "");
const TITULOS = new Map(
  [...gastoCategorias, ...ingresoCategoriasConHistoricas].map((c) => [c.slug, c.title]),
);

function norm(v: Celda) {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function clase(f: Celda[]): Clase | null {
  const t = norm(f[C.tipo]);
  if (t.startsWith("gasto")) return "Gasto";
  if (t.startsWith("ingreso")) return "Ingreso";
  if (t.startsWith("ahorro")) return "Ahorro";
  // Sin tipo pero marcada fijo/variable: es un gasto.
  const tg = norm(f[C.tipoGasto]);
  return tg === "fijo" || tg === "variable" ? "Gasto" : null;
}

// El día puede venir como número o, si la celda tiene formato fecha, como ISO.
function dia(v: Celda) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.getUTCDate();
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 31) return n;
  }
  return 1; // filas sin día (p. ej. fijos del mes): cuentan desde el 1
}

function meses(start: Date, end: Date) {
  const set = new Set<number>();
  for (let d = new Date(start); d < end; d = utcDia(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)) {
    set.add(d.getUTCMonth() + 1);
  }
  return [...set];
}

export async function getMovimientosPlanilla(
  start: Date,
  end: Date,
): Promise<Movimiento[]> {
  if (!planillaConfigurada) throw new Error("Planilla no configurada");
  const r = await llamar<Respuesta>("leer", { meses: meses(start, end) });

  const out: Movimiento[] = [];
  for (const hoja of r.hojas) {
    hoja.filas.forEach((f, i) => {
      const c = clase(f);
      const monto = Math.round(Number(f[C.monto]) * 100);
      if (!c || !Number.isFinite(monto) || monto === 0) return;

      const anio = Number(f[C.anio]) || r.anio;
      const fecha = utcDia(anio, hoja.mes - 1, dia(f[C.dia]));
      if (fecha < start || fecha >= end) return;

      const nombreCat = sinSufijoMoneda(String(f[C.categoria] ?? "").trim());
      const descripcion = String(f[C.descripcion] ?? "").trim();
      // Slug de la app si la categoría existe en ella; si no, el nombre tal cual
      // (o la descripción, en ingresos que no usan la columna Categoría).
      const categoria =
        SLUG_POR_NOMBRE.get(norm(nombreCat)) ||
        nombreCat ||
        (c === "Gasto" ? "Sin categoría" : descripcion || "Otros");
      const titulo = TITULOS.get(categoria) ?? categoria;
      const tg = norm(f[C.tipoGasto]);

      out.push({
        id: `planilla-${hoja.mes}-${i}`,
        coleccion: c === "Gasto" ? "gastos" : c === "Ingreso" ? "ingresos" : "ahorros",
        clase: c,
        fecha,
        monto,
        moneda: norm(f[C.presupuesto]).startsWith("dolar") ? "USD" : "ARS",
        categoria,
        tipo: tg === "fijo" ? "fijo" : tg === "variable" ? "variable" : undefined,
        detalle: descripcion && norm(descripcion) !== norm(titulo) ? descripcion : undefined,
      });
    });
  }
  return out.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
