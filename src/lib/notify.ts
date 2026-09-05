import { prisma } from "./prisma";
import { sendPushToAll } from "./push";

/**
 * Numero al que llegan las notificaciones de nuevos pedidos.
 *
 * Prioridad:
 *  1. Valor configurado en el panel de administracion (Setting.notifyPhone)
 *  2. Variable de entorno NOTIFY_PHONE (fallback)
 *
 * Formato recomendado: codigo de pais + numero, ej: 51987654321
 */
export const NOTIFY_PHONE_ENV = process.env.NOTIFY_PHONE || "";

export async function getNotifyPhone(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return setting?.notifyPhone || NOTIFY_PHONE_ENV || "";
}

interface OrderSummary {
  code: string;
  customerName: string;
  phone: string;
  department: string;
  district: string;
  address: string;
  total: number;
  items: { name: string; quantity: number }[];
}

/**
 * Envia una notificacion de nuevo pedido al numero configurado.
 *
 * Actualmente registra el mensaje y, si hay credenciales de WhatsApp
 * (WhatsApp Cloud API), lo envia por ese canal. Si no hay credenciales,
 * queda todo listo para conectarse mas adelante sin cambiar codigo.
 */
export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  const phone = await getNotifyPhone();

  const totalItems = order.items.reduce((n, i) => n + i.quantity, 0);
  const productos = order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");

  // 1) Notificacion PUSH tipo Shopify (llega al celular como alerta del sistema)
  await sendPushToAll({
    title: "🛎️ Nueva orden",
    body: `${totalItems} ${totalItems === 1 ? "producto" : "productos"} por S/ ${order.total.toFixed(2)} — ${productos}`,
    url: "/panel/pedidos",
  }).catch((e) => console.error("[notify] push error", e));

  const itemsText = order.items
    .map((i) => `  • ${i.quantity}x ${i.name}`)
    .join("\n");

  const message =
    `🛎️ *NUEVO PEDIDO* ${order.code}\n\n` +
    `👤 ${order.customerName}\n` +
    `📞 ${order.phone}\n` +
    `📍 ${order.department} / ${order.district}\n` +
    `🏠 ${order.address}\n\n` +
    `🧾 Productos:\n${itemsText}\n\n` +
    `💰 Total: S/ ${order.total.toFixed(2)}\n` +
    `💵 Pago: CONTRAENTREGA`;

  if (!phone) {
    console.warn("[notify] No hay numero configurado. Pedido:", order.code);
    return;
  }

  const token = process.env.WHATSAPP_TOKEN || "";
  const phoneId = process.env.WHATSAPP_PHONE_ID || "";

  // Si no hay credenciales de WhatsApp, dejamos el registro listo.
  if (!token || !phoneId) {
    console.log(
      `[notify] (modo registro) Notificacion para ${phone}:\n${message}`
    );
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (err) {
    console.error("[notify] Error enviando WhatsApp:", err);
  }
}
