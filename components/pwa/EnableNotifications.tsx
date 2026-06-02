"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISS_KEY = "notifications-prompt-dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function subscribe() {
  if (!VAPID_PUBLIC_KEY) throw new Error("Falta la clave pública VAPID");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
}

export default function EnableNotifications() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported || !VAPID_PUBLIC_KEY) return;

    if (Notification.permission === "granted") {
      // Ya tiene permiso: aseguramos que la suscripción esté registrada.
      subscribe().catch(() => {});
      return;
    }

    if (
      Notification.permission === "default" &&
      !localStorage.getItem(DISMISS_KEY)
    ) {
      setShow(true);
    }
  }, []);

  const enable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribe();
    } catch (error) {
      console.error("No se pudo activar notificaciones:", error);
    } finally {
      setShow(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

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

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-white">
            Activá las notificaciones
          </p>
          <p className="text-sm text-zinc-400">
            Enterate cuando se cargue un gasto.
          </p>
        </div>
        <Button onClick={enable} className="shrink-0 gap-1.5">
          <Bell className="size-4" />
          Activar
        </Button>
      </div>
    </div>
  );
}
