import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";
import { parseDia } from "@/lib/fecha";
import { ahorroCategorias } from "@/lib/data";
import { formatMonto, parseDetalle } from "@/lib/format";

const CATEGORIAS = new Set(ahorroCategorias.map((c) => c.slug));

type AhorroBody = {
  fecha?: string;
  monto?: number;
  moneda?: "ARS" | "USD";
  categoria?: string;
  detalle?: string;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: AhorroBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { monto, moneda, categoria } = body;
  const fecha = parseDia(body.fecha);
  const detalle = parseDetalle(body.detalle);

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
      .collection("ahorros")
      .insertOne({
        userEmail: session.user.email,
        fecha,
        monto, // en centavos
        moneda,
        categoria,
        ...(detalle && { detalle }),
        createdAt: new Date(),
      });

    // Avisamos al otro usuario quién cargó el ahorro y cuánto.
    const quien = session.user.name ?? session.user.email;
    const importe = formatMonto(monto, moneda);
    notifyOthers(session.user.email, {
      title: "Nuevo ahorro",
      body: `${quien} cargó un ahorro de ${importe}${detalle ? ` (${detalle})` : ""}`,
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
