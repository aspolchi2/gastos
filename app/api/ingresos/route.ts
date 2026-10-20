import { after } from "next/server";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";
import { agregarEnPlanilla } from "@/app/utils/planilla";
import { parseDia } from "@/lib/fecha";
import { ingresoCategorias } from "@/lib/data";

// Los cambios de divisas entran por /api/cambios (son dos movimientos enlazados).
const CATEGORIAS = new Set(
  ingresoCategorias.map((c) => c.slug).filter((s) => s !== "cambio-de-divisas"),
);

type IngresoBody = {
  fecha?: string;
  monto?: number;
  moneda?: "ARS" | "USD";
  categoria?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: IngresoBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { monto, moneda, categoria } = body;
  const fecha = parseDia(body.fecha);

  if (
    !fecha ||
    typeof monto !== "number" ||
    !Number.isSafeInteger(monto) ||
    monto <= 0 ||
    (moneda !== "ARS" && moneda !== "USD") ||
    !categoria ||
    !CATEGORIAS.has(categoria)
  ) {
    return Response.json(
      { ok: false, error: "Datos incompletos" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const result = await client
      .db("gastos")
      .collection("ingresos")
      .insertOne({
        userEmail: session.user.email,
        fecha,
        monto, // en centavos
        moneda,
        categoria,
        createdAt: new Date(),
      });

    // Avisamos al otro usuario quién cargó el ingreso y cuánto.
    const quien = session.user.name ?? session.user.email;
    const importe = (monto / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: moneda,
    });
    const email = session.user.email;
    // Después de responder: avisar al otro y copiar a la planilla. Ninguno
    // bloquea ni hace fallar el guardado.
    after(() =>
      Promise.allSettled([
        notifyOthers(email, {
          title: "Nuevo ingreso",
          body: `${quien} cargó un ingreso de ${importe}`,
          url: "/",
        }),
        agregarEnPlanilla({
          id: result.insertedId,
          coleccion: "ingresos",
          fecha,
          monto,
          moneda,
          categoria,
        }),
      ]),
    );

    return Response.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
