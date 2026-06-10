import { buildMonthlyReport } from "@/app/utils/report";
import { sendMail } from "@/app/utils/email";
import { INTEGRANTES } from "@/lib/integrantes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fecha actual en horario de Argentina (UTC-3, sin DST). Devuelve las partes del
// calendario y si hoy es el último día del mes, para decidir el envío.
function fechaArgentina() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(partes.find((p) => p.type === t)!.value);
  const year = get("year");
  const month = get("month"); // 1-12
  const day = get("day");
  // Día 0 del mes siguiente == último día del mes actual.
  const ultimoDia = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day, esUltimoDia: day === ultimoDia };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const dry = url.searchParams.get("dry") === "1";

  const { year, month, esUltimoDia } = fechaArgentina();

  // Solo enviamos el último día del mes, salvo que se fuerce (para probar).
  if (!esUltimoDia && !force) {
    return Response.json({ ok: true, enviado: false, motivo: "no es el último día del mes" });
  }

  // Rango del mes en curso [primer día, primer día del mes siguiente) en UTC,
  // coherente con cómo se guardan las fechas (medianoche UTC).
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

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
