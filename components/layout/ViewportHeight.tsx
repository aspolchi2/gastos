"use client";

import { useEffect } from "react";

/**
 * Hace que la altura de la app siga al viewport visible (visualViewport).
 * Cuando se abre el teclado en mobile, `--app-height` se reduce al área
 * visible, de modo que un footer al fondo del layout queda siempre arriba
 * del teclado, tanto en iOS como en Android.
 */
export default function ViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;

    const setHeight = () => {
      const height = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.round(height)}px`,
      );
    };

    setHeight();
    vv?.addEventListener("resize", setHeight);
    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);

    return () => {
      vv?.removeEventListener("resize", setHeight);
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
    };
  }, []);

  return null;
}
