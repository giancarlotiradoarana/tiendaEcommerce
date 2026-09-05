import webpush from "web-push";
import { prisma } from "./prisma";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:admin@aroma.pe";

let configured = false;
function ensureConfigured() {
  if (!configured && publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return configured;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Envia una notificacion push a todos los dispositivos suscritos.
 * Limpia automaticamente las suscripciones que ya no son validas.
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID no configurado, se omite el envio push");
    return;
  }

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) {
    console.log("[push] No hay dispositivos suscritos todavia");
    return;
  }

  const data = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 = suscripcion expirada o cancelada -> la eliminamos
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { endpoint: sub.endpoint } })
            .catch(() => {});
        } else {
          console.error("[push] Error enviando push:", statusCode || err);
        }
      }
    })
  );
}
