// Bus de eventos en memoria para notificar nuevos pedidos en tiempo real (SSE)

type Listener = (data: string) => void;

// Guardamos los listeners en el objeto global para que sobrevivan al
// hot-reload de Next en desarrollo.
const g = globalThis as unknown as { __orderListeners?: Set<Listener> };
if (!g.__orderListeners) g.__orderListeners = new Set<Listener>();

const listeners = g.__orderListeners;

export function addOrderListener(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitNewOrder(payload: {
  id: string;
  code: string;
  customerName: string;
  total: number;
}) {
  const data = JSON.stringify(payload);
  listeners.forEach((fn) => {
    try {
      fn(data);
    } catch {}
  });
}
