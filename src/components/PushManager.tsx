"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export default function PushManager() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const enable = async () => {
    setLoading(true);
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Debes permitir las notificaciones en tu navegador.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setSubscribed(true);
        setMsg("✅ Notificaciones activadas en este dispositivo.");
      } else {
        setMsg("No se pudo guardar la suscripción.");
      }
    } catch (e) {
      setMsg("Error al activar. Asegúrate de usar HTTPS o localhost.");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notificaciones desactivadas en este dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setMsg("");
    const res = await fetch("/api/admin/push", { method: "PUT" });
    setMsg(res.ok ? "📨 Notificación de prueba enviada." : "Error al enviar prueba.");
  };

  if (!supported) {
    return (
      <div className="card-glass rounded-2xl p-6">
        <h2 className="font-bold text-white">🔔 Notificaciones push</h2>
        <p className="mt-2 text-sm text-yellow-400">
          Tu navegador no soporta notificaciones push. Usa Chrome en Android o
          Safari en iOS 16.4+.
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-6">
      <h2 className="font-bold text-white">🔔 Notificaciones de nuevos pedidos</h2>
      <p className="mt-2 text-sm text-gray-400">
        Recibe una alerta en este dispositivo cada vez que entre una orden, con
        la cantidad, el total y los productos. Igual que Shopify.
      </p>

      {msg && <p className="mt-3 text-sm text-gold">{msg}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        {!subscribed ? (
          <button onClick={enable} disabled={loading} className="btn-gold rounded-xl px-5 py-2.5 text-sm disabled:opacity-50">
            {loading ? "Activando..." : "Activar notificaciones"}
          </button>
        ) : (
          <>
            <button onClick={test} className="btn-gold rounded-xl px-5 py-2.5 text-sm">
              Enviar prueba
            </button>
            <button onClick={disable} disabled={loading} className="rounded-xl gold-border px-5 py-2.5 text-sm text-gold disabled:opacity-50">
              Desactivar
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        💡 Tip: en tu celular, abre esta página en Chrome, toca el menú (⋮) y
        elige &quot;Agregar a pantalla de inicio&quot;. Así el panel funciona como
        una app y las notificaciones llegan aunque lo tengas cerrado.
      </p>
    </div>
  );
}
