import { ObjectId } from "mongodb";
import { after } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";
import { borrarDePlanilla } from "@/app/utils/planilla";
import { formatMonto } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLECCIONES = ["gastos", "ingresos", "ahorros"] as const;
type Coleccion = (typeof COLECCIONES)[number];

const ARTICULO: Record<Coleccion, string> = {
  gastos: "un gasto",
  ingresos: "un ingreso",
  ahorros: "un ahorro",
};

function esColeccion(v: string | null): v is Coleccion {
  return v !== null && (COLECCIONES as readonly string[]).includes(v);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const coleccion = url.searchParams.get("coleccion");
  const id = url.searchParams.get("id");

  if (!esColeccion(coleccion) || !id || !ObjectId.isValid(id)) {
    return Response.json(
      { ok: false, error: "Datos inválidos" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db("gastos");
    const col = db.collection(coleccion);

    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return Response.json(
        { ok: false, error: "No encontrado" },
        { status: 404 },
      );
    }

    // Un cambio de divisas son dos ingresos enlazados por `cambioId`: si se
    // borra uno solo se desbalancean los saldos, así que borramos el par.
    let deleted: number;
    if (doc.cambioId) {
      const r = await db
        .collection("ingresos")
        .deleteMany({ cambioId: doc.cambioId });
      deleted = r.deletedCount;
    } else {
      const r = await col.deleteOne({ _id: new ObjectId(id) });
      deleted = r.deletedCount;
    }

    const quien = session.user.name ?? session.user.email;
    const importe = formatMonto(Math.abs(doc.monto), doc.moneda);
    const que = doc.cambioId
      ? "un cambio de divisas"
      : `${ARTICULO[coleccion]} de ${importe}`;
    const email = session.user.email;
    // Los cambios de divisas y los ahorros no se copian a la planilla.
    const enPlanilla = !doc.cambioId && coleccion !== "ahorros";
    after(() =>
      Promise.allSettled([
        notifyOthers(email, {
          title: "Movimiento eliminado",
          body: `${quien} eliminó ${que}`,
          url: "/movimientos",
        }),
        enPlanilla && borrarDePlanilla(doc._id, doc.fecha),
      ]),
    );

    return Response.json({ ok: true, deleted });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
