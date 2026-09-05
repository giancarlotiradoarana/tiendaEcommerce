"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, Volume2, VolumeX } from "lucide-react";

interface Latest {
  id: string;
  code: string;
  customerName: string;
  total: number;
  createdAt: string;
}

const AUDIO_FALLBACK = "/audio.mp3";
const POLL_MS = 10000;

export default function OrderAlert() {
  const [toast, setToast] = useState<Latest | null>(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false); // audio habilitado por interacción
  const lastCount = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const armed = useRef(false);

  // Inicializa el audio y lo "desbloquea" en la primera interacción del usuario.
  // Truco: al primer clic/tecla reproducimos en silencio y pausamos; a partir de
  // ahí el navegador permite reproducir cuando queramos.
  useEffect(() => {
    const a = new Audio(AUDIO_FALLBACK);
    a.preload = "auto";
    audioRef.current = a;

    // Cargar el audio configurado desde el panel
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.notifySound && audioRef.current) {
          audioRef.current.src = d.notifySound;
        }
      })
      .catch(() => {});

    const enable = () => {
      const el = audioRef.current;
      if (!el) return;
      const prevVol = el.volume;
      el.volume = 0;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = prevVol;
          setReady(true);
          window.removeEventListener("pointerdown", enable);
          window.removeEventListener("keydown", enable);
        })
        .catch(() => {
          el.volume = prevVol;
        });
    };

    window.addEventListener("pointerdown", enable);
    window.addEventListener("keydown", enable);
    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  const playSound = () => {
    const el = audioRef.current;
    if (!el || muted) return;
    el.volume = 1;
    el.currentTime = 0;
    el.play().catch(() => {
      // si el navegador lo bloquea, marcamos que hace falta habilitar
      setReady(false);
    });
  };

  // Tiempo real con SSE: el servidor empuja el evento al instante.
  // Si la conexión falla, cae a sondeo como respaldo.
  useEffect(() => {
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const handleNew = (order: Latest) => {
      setToast(order);
      playSound();
    };

    const startPollingFallback = () => {
      const check = async () => {
        try {
          const res = await fetch("/api/admin/orders/latest", { cache: "no-store" });
          if (!res.ok) return;
          const data: { count: number; latest: Latest | null } = await res.json();
          if (lastCount.current === null) { lastCount.current = data.count; armed.current = true; return; }
          if (armed.current && data.count > lastCount.current && data.latest) handleNew(data.latest);
          lastCount.current = data.count;
        } catch {}
      };
      pollId = setInterval(check, POLL_MS);
      check();
    };

    try {
      es = new EventSource("/api/admin/orders/stream");
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.type === "connected") return;
          if (payload?.code) handleNew(payload as Latest);
        } catch {}
      };
      es.onerror = () => {
        // si SSE falla, activamos el sondeo de respaldo una sola vez
        if (!pollId) startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }

    return () => {
      es?.close();
      if (pollId) clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return (
    <>
      {/* Aviso persistente para habilitar el sonido (hasta que se active) */}
      {!ready && !muted && (
        <button
          onClick={() => {
            const el = audioRef.current;
            if (!el) return;
            el.volume = 1;
            el.currentTime = 0;
            el.play().then(() => setReady(true)).catch(() => {});
          }}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-glow"
        >
          🔊 Activar sonido de pedidos
        </button>
      )}

      {/* Botón silenciar/activar (cuando ya está habilitado) */}
      {ready && (
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? "Activar sonido" : "Silenciar"}
          className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full gold-border bg-ink text-gold shadow-glow hover:bg-gold/10"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Aviso visual de nuevo pedido */}
      {toast && (
        <div className="fixed bottom-20 right-4 z-50 w-80 animate-[slideIn_0.3s_ease] rounded-2xl border border-gold/40 bg-ink-soft p-4 shadow-glow">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15">
              <Bell className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gold">🛎️ ¡Nuevo pedido!</p>
              <p className="mt-1 text-sm text-white">{toast.customerName}</p>
              <p className="text-xs text-gray-400">{toast.code} · S/ {toast.total.toFixed(2)}</p>
              <a href="/panel/pedidos" className="mt-2 inline-block text-xs text-gold hover:underline">Ver pedido →</a>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}
