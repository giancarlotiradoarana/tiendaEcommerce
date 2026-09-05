import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyNewOrder } from "@/lib/notify";
import { emitNewOrder } from "@/lib/events";

const orderSchema = z.object({
  customerName: z
    .string()
    .min(2, "Nombre requerido")
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, "El nombre solo puede contener letras"),
  phone: z.string().regex(/^9\d{8}$/, "El celular debe tener 9 dígitos y empezar con 9"),
  department: z.string().min(2, "Departamento requerido"),
  province: z.string().min(2, "Provincia requerida"),
  district: z.string().min(2, "Distrito requerido"),
  address: z.string().min(4, "Dirección requerida"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "El carrito está vacío"),
});

function genCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const d = new Date();
  return `AR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${n}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    // Traer productos reales para calcular precio y validar stock (nunca confiar en el cliente)
    const ids = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });

    if (products.length !== ids.length) {
      return NextResponse.json(
        { error: "Alguno de los productos ya no está disponible" },
        { status: 400 }
      );
    }

    let total = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (item.quantity > product.stock) {
        throw new Error(`Sin stock suficiente de ${product.name}`);
      }
      total += product.price * item.quantity;
      return {
        productId: product.id,
        name: `${product.brand} ${product.name}`,
        price: product.price,
        quantity: item.quantity,
      };
    });

    // Crear pedido y descontar stock. La VENTA se registra recién cuando
    // el pedido se marque como ENTREGADO (dinero realmente cobrado).
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          code: genCode(),
          customerName: data.customerName,
          phone: data.phone,
          department: data.department,
          province: data.province,
          district: data.district,
          address: data.address,
          reference: data.reference || null,
          notes: data.notes || null,
          total,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    // Empujar evento en tiempo real al panel (audio + aviso al instante)
    emitNewOrder({
      id: order.id,
      code: order.code,
      customerName: order.customerName,
      total: order.total,
    });

    // Disparar notificacion al numero configurado (no bloquea la respuesta)
    notifyNewOrder({
      code: order.code,
      customerName: order.customerName,
      phone: order.phone,
      department: order.department,
      district: order.district,
      address: order.address,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
    }).catch((e) => console.error("notify error", e));

    return NextResponse.json({ ok: true, code: order.code });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "Error al crear el pedido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
