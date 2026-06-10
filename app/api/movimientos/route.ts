import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLECCIONES = ["gastos", "ingresos", "ahorros"] as const;
type Coleccion = (typeof COLECCIONES)[number];

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
    notifyOthers(session.user.email, {
      title: "Movimiento eliminado",
      body: `${quien} eliminó un movimiento`,
      url: "/movimientos",
    }).catch(() => {
      // No bloqueamos la respuesta si falla la notificación.
    });

    return Response.json({ ok: true, deleted });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
