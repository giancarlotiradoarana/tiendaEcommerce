import { addOrderListener } from "@/lib/events";
import { requireAuth } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Stream SSE: empuja un evento en cuanto entra un pedido nuevo
export async function GET() {
  try {
    await requireAuth();
  } catch {
    return new Response("No autorizado", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // evento inicial de conexión
      send(JSON.stringify({ type: "connected" }));

      const unsubscribe = addOrderListener((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {}
      });

      // keep-alive cada 25s para que la conexión no se cierre
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      }, 25000);

      // Cleanup si el cliente cierra
      // @ts-expect-error - signal no está tipado en este contexto
      controller._cleanup = () => {
        clearInterval(ping);
        unsubscribe();
      };
    },
    cancel() {
      // @ts-expect-error - acceso al cleanup
      this._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
