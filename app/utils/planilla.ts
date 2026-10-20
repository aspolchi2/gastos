import { ObjectId } from "mongodb";
import clientPromise from "@/app/utils/mongodb";
import { gastoCategorias, ingresoCategoriasConHistoricas } from "@/lib/data";

// Copia gastos e ingresos a la planilla "Presupuesto ARS & USD" a través del
// mismo Apps Script que usa el bot de Telegram (acciones app_add/app_delete).
// Mongo es la fuente de verdad: si la planilla falla, el movimiento queda
// guardado igual y el error se anota en el documento (campo `planilla`).

const URL = process.env.SHEETS_URL;
const SECRET = process.env.SHEETS_SECRET;

// slug de la app → opción del desplegable "Categoría" de la planilla. Las que
// no tienen equivalente quedan sin categoría (la descripción las identifica).
export const CATEGORIA_PLANILLA: Record<string, string> = {
  alimentacion: "Alimentación",
  "arreglos-casa": "Arreglos casa",
  "arreglos-auto": "Auto",
  belleza: "Belleza",
  delivery: "Delivery",
  entretenimiento: "Entretenimiento",
  extras: "Extras",
  gatas: "Gatas",
  indumentaria: "Indumentaria",
  transporte: "Transporte",
  salud: "Salud",
  ejercicio: "Ejercicio",
  impuestos: "Impuestos",
  seguros: "Seguros",
  servicios: "Servicios",
  tarjetas: "Tarjetas",
  "cuota-hipotecario": "Cuota hipotecario",
  "pago-de-deudas": "Pago de deudas",
};

// Categorías de ingreso con equivalente en la planilla.
export const INGRESO_PLANILLA: Record<string, string> = {
  "ingreso-extra": "Ingreso Extra",
  "sueldo-agustin": "Sueldo Agustin",
  "sueldo-ro": "Sueldo Ro",
};

// En la planilla algunas categorías tienen una variante en dólares aparte
// ("Tarjetas USD", "Sueldo Ro USD").
const VARIANTE_USD = new Set(["tarjetas", "sueldo-ro"]);
// Y otras llevan siempre la moneda en el nombre ("Pago de deudas ARS/USD").
const CON_MONEDA = new Set(["pago-de-deudas"]);

function categoriaPlanilla(m: MovimientoPlanilla) {
  const nombre =
    m.coleccion === "ingresos"
      ? INGRESO_PLANILLA[m.categoria]
      : CATEGORIA_PLANILLA[m.categoria];
  if (!nombre) return "";
  if (CON_MONEDA.has(m.categoria)) return `${nombre} ${m.moneda}`;
  return m.moneda === "USD" && VARIANTE_USD.has(m.categoria) ? `${nombre} USD` : nombre;
}

const TITULOS = new Map(
  [...gastoCategorias, ...ingresoCategoriasConHistoricas].map((c) => [c.slug, c.title]),
);

export type MovimientoPlanilla = {
  id: ObjectId;
  coleccion: "gastos" | "ingresos";
  fecha: Date; // medianoche UTC
  monto: number; // centavos
  moneda: "ARS" | "USD";
  categoria: string;
  tipo?: "variable" | "fijo";
  detalle?: string;
};

// Descripción de la fila: el detalle si lo hay. Si la categoría no tiene
// equivalente en el desplegable, la anteponemos para no perderla.
function descripcion(m: MovimientoPlanilla) {
  const titulo = TITULOS.get(m.categoria) ?? m.categoria;
  if (!m.detalle) return titulo;
  const enDesplegable = categoriaPlanilla(m) !== "";
  return enDesplegable ? m.detalle : `${titulo} · ${m.detalle}`;
}

export async function llamar<T = Record<string, unknown>>(
  action: string,
  datos: Record<string, unknown> = {},
): Promise<T & { ok: true }> {
  const res = await fetch(URL!, {
    method: "POST",
    // Apps Script no acepta application/json sin preflight; el bot usa lo mismo.
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ secret: SECRET, action, ...datos }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const texto = await res.text();
  let data: { ok: boolean; error?: string } & T;
  try {
    data = JSON.parse(texto);
  } catch {
    throw new Error(`Respuesta inesperada del Apps Script (${res.status})`);
  }
  if (!data.ok) throw new Error(data.error ?? "Error del Apps Script");
  return data as T & { ok: true };
}

async function anotar(m: MovimientoPlanilla, estado: Record<string, unknown>) {
  const client = await clientPromise;
  await client
    .db("gastos")
    .collection(m.coleccion)
    .updateOne({ _id: m.id }, { $set: { planilla: { ...estado, at: new Date() } } });
}

/** Escribe el movimiento en la pestaña de su mes. No tira: anota el resultado. */
export const planillaConfigurada = Boolean(URL && SECRET);

export async function agregarEnPlanilla(m: MovimientoPlanilla) {
  if (!URL || !SECRET) return;
  try {
    await llamar("app_add", {
      id: m.id.toString(),
      clase: m.coleccion === "gastos" ? "Gasto" : "Ingreso",
      tipoGasto: m.coleccion === "gastos" ? m.tipo : "",
      dia: m.fecha.getUTCDate(),
      mes: m.fecha.getUTCMonth() + 1,
      anio: m.fecha.getUTCFullYear(),
      descripcion: descripcion(m),
      categoria: categoriaPlanilla(m),
      moneda: m.moneda,
      monto: m.monto / 100,
    });
    await anotar(m, { ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Planilla: no se pudo agregar", m.id.toString(), msg);
    await anotar(m, { ok: false, error: msg }).catch(() => {});
  }
}

/** Saca de la planilla la fila de un movimiento borrado en la app. */
export async function borrarDePlanilla(id: ObjectId, fecha: Date) {
  if (!URL || !SECRET) return;
  try {
    await llamar("app_delete", {
      id: id.toString(),
      mes: fecha.getUTCMonth() + 1,
    });
  } catch (error) {
    console.error(
      "Planilla: no se pudo borrar",
      id.toString(),
      error instanceof Error ? error.message : error,
    );
  }
}
