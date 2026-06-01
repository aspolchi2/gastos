"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "ios" | "android";

const DISMISS_KEY = "install-prompt-dismissed";

export default function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (standalone) return;

    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    if (ios) {
      // Detección client-only de una sola vez (no posible en SSR sin mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("ios");
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setMode("hidden");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode("hidden");
  };

  if (mode === "hidden") return null;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 pr-10">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Descartar"
        className="absolute right-3 top-3 text-zinc-500 active:scale-95"
      >
        <X className="size-4" />
      </button>

      {mode === "ios" ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-white">
            Instalá Gastos en tu inicio
          </p>
          <p className="text-sm text-zinc-400">
            Tocá{" "}
            <Share className="inline size-4 -translate-y-0.5 text-zinc-300" />{" "}
            Compartir y después{" "}
            <span className="text-zinc-200">Agregar a inicio</span>.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-white">Instalá Gastos</p>
            <p className="text-sm text-zinc-400">
              Acceso rápido desde tu inicio.
            </p>
          </div>
          <Button onClick={install} className="shrink-0 gap-1.5">
            <Download className="size-4" />
            Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
