import { ObjectId } from "mongodb";
import clientPromise from "@/app/utils/mongodb";

export type Coleccion = "gastos" | "ingresos" | "ahorros";
export type Moneda = "ARS" | "USD";
export type Clase = "Gasto" | "Ingreso" | "Ahorro";

/** Movimiento unificado de cualquiera de las tres colecciones. Montos en centavos. */
export type Movimiento = {
  id: string;
  coleccion: Coleccion;
  clase: Clase;
  fecha: Date;
  monto: number;
  moneda: Moneda;
  categoria?: string;
  tipo?: "fijo" | "variable";
  origen?: string;
  userEmail?: string;
  /** Presente en los ingresos que forman parte de un cambio de divisas. */
  cambioId?: string;
};

type Doc = {
  _id: ObjectId;
  fecha: Date;
  monto: number;
  moneda: Moneda;
  categoria?: string;
  tipo?: "fijo" | "variable";
  origen?: string;
  userEmail?: string;
  cambioId?: ObjectId;
};

/**
 * Devuelve todos los movimientos del rango [start, end) (end exclusivo) de las
 * tres colecciones, unificados y ordenados por fecha ascendente.
 */
export async function getMovimientos(
  start: Date,
  end: Date,
): Promise<Movimiento[]> {
  const client = await clientPromise;
  const db = client.db("gastos");
  const match = { fecha: { $gte: start, $lt: end } };

  const [gastos, ingresos, ahorros] = await Promise.all([
    db.collection<Doc>("gastos").find(match).toArray(),
    db.collection<Doc>("ingresos").find(match).toArray(),
    db.collection<Doc>("ahorros").find(match).toArray(),
  ]);

  const map = (docs: Doc[], coleccion: Coleccion, clase: Clase): Movimiento[] =>
    docs.map((d) => ({
      id: d._id.toString(),
      coleccion,
      clase,
      fecha: d.fecha,
      monto: d.monto,
      moneda: d.moneda,
      categoria: d.categoria,
      tipo: d.tipo,
      origen: d.origen,
      userEmail: d.userEmail,
      cambioId: d.cambioId?.toString(),
    }));

  return [
    ...map(gastos, "gastos", "Gasto"),
    ...map(ingresos, "ingresos", "Ingreso"),
    ...map(ahorros, "ahorros", "Ahorro"),
  ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
