import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import clientPromise from "@/app/utils/mongodb";
import { notifyOthers } from "@/app/utils/push";

type CambioBody = {
  fecha?: string;
  // "usd-ars": vendo dólares y recibo pesos. "ars-usd": compro dólares.
  direccion?: "usd-ars" | "ars-usd";
  usd?: number; // cantidad de dólares, en centavos
  precio?: number; // precio del dólar en ARS, en centavos
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: CambioBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { fecha, direccion, usd, precio } = body;

  if (
    !fecha ||
    (direccion !== "usd-ars" && direccion !== "ars-usd") ||
    typeof usd !== "number" ||
    usd <= 0 ||
    typeof precio !== "number" ||
    precio <= 0
  ) {
    return Response.json(
      { ok: false, error: "Datos incompletos" },
      { status: 400 },
    );
  }

  // Total en pesos (centavos): usd_cents * precio_cents / 100.
  const totalArs = Math.round((usd * precio) / 100);

  // Un cambio se asienta como dos movimientos de ingreso enlazados por cambioId:
  // uno descuenta una moneda y otro suma la otra. Así saldos.ts y el balance lo
  // toman sin cambios (todos los ingresos van al pozo "ingresos-mensuales").
  const cambioId = new ObjectId();
  const base = {
    userEmail: session.user.email,
    fecha: new Date(fecha),
    categoria: "cambio-de-divisas",
    cambioId,
    direccion,
    precio,
    createdAt: new Date(),
  };

  const movimientos =
    direccion === "usd-ars"
      ? [
          { ...base, moneda: "USD", monto: -usd },
          { ...base, moneda: "ARS", monto: totalArs },
        ]
      : [
          { ...base, moneda: "ARS", monto: -totalArs },
          { ...base, moneda: "USD", monto: usd },
        ];

  try {
    const client = await clientPromise;
    await client.db("gastos").collection("ingresos").insertMany(movimientos);

    const quien = session.user.name ?? session.user.email;
    const dolares = (usd / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: "USD",
    });
    const pesos = (totalArs / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });
    const detalle =
      direccion === "usd-ars"
        ? `vendió ${dolares} a ${pesos}`
        : `compró ${dolares} con ${pesos}`;
    notifyOthers(session.user.email, {
      title: "Cambio de divisas",
      body: `${quien} ${detalle}`,
      url: "/resumen",
    }).catch(() => {
      // No bloqueamos la respuesta si falla la notificación.
    });

    return Response.json({ ok: true, cambioId }, { status: 201 });
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
