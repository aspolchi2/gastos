import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";

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

  const { fecha, monto, moneda, categoria } = body;

  if (
    !fecha ||
    typeof monto !== "number" ||
    monto <= 0 ||
    (moneda !== "ARS" && moneda !== "USD") ||
    !categoria
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
        fecha: new Date(fecha),
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
    notifyOthers(session.user.email, {
      title: "Nuevo ingreso",
      body: `${quien} cargó un ingreso de ${importe}`,
      url: "/",
    }).catch(() => {
      // No bloqueamos la respuesta si falla el envío de la notificación.
    });

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
