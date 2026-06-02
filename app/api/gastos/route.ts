import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";

type GastoBody = {
  fecha?: string;
  monto?: number;
  moneda?: "ARS" | "USD";
  tipo?: "variable" | "fijo";
  categoria?: string;
  origen?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: GastoBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { fecha, monto, moneda, tipo, categoria, origen } = body;

  if (
    !fecha ||
    typeof monto !== "number" ||
    monto <= 0 ||
    (moneda !== "ARS" && moneda !== "USD") ||
    (tipo !== "variable" && tipo !== "fijo") ||
    !categoria ||
    !origen
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
      .collection("gastos")
      .insertOne({
        userEmail: session.user.email,
        fecha: new Date(fecha),
        monto, // en centavos
        moneda,
        tipo,
        categoria,
        origen,
        createdAt: new Date(),
      });

    // Avisamos al otro usuario quién cargó el gasto y cuánto.
    const quien = session.user.name ?? session.user.email;
    const importe = (monto / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: moneda,
    });
    notifyOthers(session.user.email, {
      title: "Nuevo gasto",
      body: `${quien} cargó un gasto de ${importe}`,
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
