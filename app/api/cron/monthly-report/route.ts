import { buildMonthlyReport } from "@/app/utils/report";
import { sendMail } from "@/app/utils/email";
import { INTEGRANTES } from "@/lib/integrantes";
import { partesArgentina, utcDia } from "@/lib/fecha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const dry = url.searchParams.get("dry") === "1";

  const { year, month, day } = partesArgentina();

  // Se envía el día 1 con el mes anterior ya cerrado: así entra todo lo cargado
  // el último día, incluso después del mediodía. Con force=1 se manda el mes en
  // curso (para probar).
  if (day !== 1 && !force) {
    return Response.json({ ok: true, enviado: false, motivo: "no es el primer día del mes" });
  }

  // Rango [primer día, primer día del mes siguiente) en medianoches UTC,
  // coherente con cómo se guardan las fechas. `month` es 1-12.
  const mes = force ? month - 1 : month - 2;
  const start = utcDia(year, mes, 1);
  const end = utcDia(year, mes + 1, 1);

  try {
    const { buffer, filename, periodoLabel, resumenTexto } =
      await buildMonthlyReport(start, end);

    if (dry) {
      return Response.json({ ok: true, enviado: false, dry: true, periodoLabel, resumenTexto, bytes: buffer.length });
    }

    await sendMail({
      to: [...INTEGRANTES],
      subject: `Resumen de gastos — ${periodoLabel}`,
      text:
        `Adjuntamos el resumen de gastos de ${periodoLabel}.\n\n${resumenTexto}\n\n— Gastos`,
      attachments: [
        {
          filename,
          content: buffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    return Response.json({ ok: true, enviado: true, periodoLabel, destinatarios: INTEGRANTES.length });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
