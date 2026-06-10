import ExcelJS from "exceljs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getMovimientos, type Movimiento, type Moneda } from "@/app/utils/movimientos";
import {
  gastoCategorias,
  ingresoCategorias,
  ahorroCategorias,
  origenes,
} from "@/lib/data";

// slug → título legible, para no mostrar los slugs crudos en el Excel.
const titulos = new Map<string, string>(
  [...gastoCategorias, ...ingresoCategorias, ...ahorroCategorias, ...origenes].map(
    (c) => [c.slug, c.title],
  ),
);
const titulo = (slug?: string) => (slug ? titulos.get(slug) ?? slug : "");

// Las fechas se guardan a medianoche UTC; las formateamos con getters UTC para
// no correrlas un día en zonas horarias con offset negativo (p. ej. AR).
function fmtFechaUTC(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

const ARS_FMT = '#,##0.00;[Red]-#,##0.00';

function pesos(cents: number, currency: Moneda = "ARS") {
  return (cents / 100).toLocaleString("es-AR", { style: "currency", currency });
}

export type ReportResult = {
  buffer: Buffer;
  filename: string;
  periodoLabel: string;
  resumenTexto: string;
};

/**
 * Construye el Excel del período [start, end) con dos hojas: "Detalle" (todos
 * los movimientos fila por fila) y "Resumen" (totales por categoría y balance).
 * `end` es exclusivo.
 */
export async function buildMonthlyReport(
  start: Date,
  end: Date,
): Promise<ReportResult> {
  const movimientos = await getMovimientos(start, end);

  // El rango se calcula en UTC (las fechas se guardan a medianoche UTC), pero
  // `format` usa hora local. Reconstruimos una fecha local desde las partes UTC
  // para que el mes del label/filename sea correcto en cualquier zona horaria.
  const periodo = new Date(start.getUTCFullYear(), start.getUTCMonth(), 1);
  const periodoLabel = format(periodo, "MMMM yyyy", { locale: es });
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gastos";
  wb.created = new Date();

  // ── Hoja Detalle ──────────────────────────────────────────────────────────
  const det = wb.addWorksheet("Detalle");
  det.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Movimiento", key: "clase", width: 12 },
    { header: "Categoría", key: "categoria", width: 22 },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Origen", key: "origen", width: 20 },
    { header: "Monto", key: "monto", width: 16 },
    { header: "Moneda", key: "moneda", width: 9 },
    { header: "Cargó", key: "quien", width: 26 },
  ];
  for (const m of movimientos) {
    det.addRow({
      fecha: fmtFechaUTC(m.fecha),
      clase: m.clase,
      categoria: titulo(m.categoria),
      tipo: m.tipo ? (m.tipo === "fijo" ? "Fijo" : "Variable") : "",
      origen: titulo(m.origen),
      monto: m.monto / 100,
      moneda: m.moneda,
      quien: m.userEmail ?? "",
    });
  }
  det.getColumn("monto").numFmt = ARS_FMT;
  det.getRow(1).font = { bold: true };
  det.views = [{ state: "frozen", ySplit: 1 }];
  det.autoFilter = { from: "A1", to: "H1" };

  // ── Hoja Resumen ──────────────────────────────────────────────────────────
  const res = wb.addWorksheet("Resumen");
  res.columns = [
    { header: "", key: "a", width: 28 },
    { header: "ARS", key: "ars", width: 16 },
    { header: "USD", key: "usd", width: 16 },
  ];

  const sumPorCategoria = (movs: Movimiento[]) => {
    const map = new Map<string, { ars: number; usd: number }>();
    for (const m of movs) {
      const k = titulo(m.categoria) || "Otros";
      const e = map.get(k) ?? { ars: 0, usd: 0 };
      if (m.moneda === "USD") e.usd += m.monto;
      else e.ars += m.monto;
      map.set(k, e);
    }
    return [...map.entries()].sort((a, b) => b[1].ars - a[1].ars);
  };
  const totalPorMoneda = (movs: Movimiento[]) => ({
    ars: movs.filter((m) => m.moneda === "ARS").reduce((a, m) => a + m.monto, 0),
    usd: movs.filter((m) => m.moneda === "USD").reduce((a, m) => a + m.monto, 0),
  });

  const gMovs = movimientos.filter((m) => m.clase === "Gasto");
  const iMovs = movimientos.filter((m) => m.clase === "Ingreso");
  const aMovs = movimientos.filter((m) => m.clase === "Ahorro");
  const gTot = totalPorMoneda(gMovs);
  const iTot = totalPorMoneda(iMovs);
  const aTot = totalPorMoneda(aMovs);

  const tituloFila = (text: string) => {
    const row = res.addRow({ a: text });
    row.font = { bold: true };
    return row;
  };
  const fmtRow = (row: ExcelJS.Row) => {
    row.getCell("ars").numFmt = ARS_FMT;
    row.getCell("usd").numFmt = ARS_FMT;
  };

  const headerRow = res.addRow({ a: `Período: ${periodoLabel}` });
  headerRow.font = { bold: true, size: 14 };
  res.addRow({});

  fmtRow(tituloFila("Balance (ingresos − gastos)"));
  fmtRow(
    res.addRow({
      a: "Balance",
      ars: (iTot.ars - gTot.ars) / 100,
      usd: (iTot.usd - gTot.usd) / 100,
    }),
  );
  res.addRow({});

  const seccion = (label: string, movs: Movimiento[], tot: { ars: number; usd: number }) => {
    tituloFila(label);
    for (const [cat, v] of sumPorCategoria(movs)) {
      fmtRow(res.addRow({ a: cat, ars: v.ars / 100, usd: v.usd / 100 }));
    }
    const totalRow = res.addRow({ a: "Total", ars: tot.ars / 100, usd: tot.usd / 100 });
    totalRow.font = { bold: true };
    fmtRow(totalRow);
    res.addRow({});
  };
  seccion("Gastos por categoría", gMovs, gTot);
  seccion("Ingresos por categoría", iMovs, iTot);
  seccion("Ahorros del período por categoría", aMovs, aTot);

  res.getRow(1).font = { bold: true };

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const filename = `gastos-${format(periodo, "yyyy-MM")}.xlsx`;
  const resumenTexto =
    `Movimientos: ${movimientos.length}\n` +
    `Gastos: ${pesos(gTot.ars)}${gTot.usd ? ` + ${pesos(gTot.usd, "USD")}` : ""}\n` +
    `Ingresos: ${pesos(iTot.ars)}${iTot.usd ? ` + ${pesos(iTot.usd, "USD")}` : ""}\n` +
    `Balance: ${pesos(iTot.ars - gTot.ars)}` +
    `${iTot.usd - gTot.usd ? ` + ${pesos(iTot.usd - gTot.usd, "USD")}` : ""}`;

  return { buffer, filename, periodoLabel, resumenTexto };
}
