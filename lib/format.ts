export type Moneda = "ARS" | "USD";

/**
 * Monto guardado en centavos → texto con moneda. Los pesos se muestran sin
 * centavos ("$ 1.500"); los dólares con dos decimales ("US$ 12,50").
 */
export function formatMonto(cents: number, currency: Moneda = "ARS") {
  const decimales = currency === "ARS" ? 0 : 2;
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export const DETALLE_MAX = 120;

/** Detalle opcional de un movimiento: texto recortado, o undefined si viene vacío. */
export function parseDetalle(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().replace(/\s+/g, " ").slice(0, DETALLE_MAX);
  return t || undefined;
}
