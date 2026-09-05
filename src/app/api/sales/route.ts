import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireSeller, guardResponse } from "@/lib/guard";
import { genSaleCode, getOpenRegister, getTaxRate } from "@/lib/pos";

const saleSchema = z.object({
  customerName: z.string().optional(),
  customerDoc: z.string().optional(),
  customerPhone: z.string().optional(),
  couponCode: z.string().optional(),
  docType: z.enum(["BOLETA", "TICKET", "NOTA"]).default("TICKET"),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "YAPE", "PLIN", "TRANSFERENCIA"]).default("EFECTIVO"),
  discount: z.number().min(0).default(0),
  received: z.number().min(0).default(0),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .min(1, "Agrega al menos un producto"),
});

// Listar ventas (admin ve todas, vendedor solo las suyas)
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const isAdmin = session.user.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "1";
    const q = (searchParams.get("q") || "").trim();
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to");
    const channel = searchParams.get("channel"); // FISICA | WEB
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));

    // Rango de fechas
    let createdAt: { gte?: Date; lte?: Date } | undefined;
    if (from || to) {
      createdAt = {};
      if (from) createdAt.gte = new Date(`${from}T00:00:00`);
      if (to) createdAt.lte = new Date(`${to}T23:59:59`);
    }

    const where = {
      ...(isAdmin && !mine ? {} : { userId: session.user.id }),
      ...(channel ? { channel: channel as never } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { customerName: { contains: q } },
              { paymentMethod: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true, user: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      sales,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Registrar una venta fisica (POS) — solo vendedor
export async function POST(req: Request) {
  try {
    const session = await requireSeller();
    const userId = session.user.id!;

    const register = await getOpenRegister(userId);
    if (!register) {
      return NextResponse.json(
        { error: "Debes abrir la caja antes de vender" },
        { status: 400 }
      );
    }

    const data = saleSchema.parse(await req.json());
    const taxRate = await getTaxRate();

    const ids = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
    });
    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Producto no disponible" }, { status: 400 });
    }

    let gross = 0;
    const saleItems = data.items.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
      if (item.quantity > p.stock) {
        throw new Error(`Sin stock suficiente de ${p.name} (quedan ${p.stock})`);
      }
      const lineTotal = p.price * item.quantity;
      gross += lineTotal;
      return {
        productId: p.id,
        name: `${p.brand} ${p.name}`,
        price: p.price,
        quantity: item.quantity,
        total: lineTotal,
      };
    });

    const discount = Math.min(data.discount, gross);
    const net = gross - discount;
    // El precio ya incluye IGV: desglosamos
    const subtotal = net / (1 + taxRate / 100);
    const tax = net - subtotal;
    const total = net;
    const change =
      data.paymentMethod === "EFECTIVO" ? Math.max(0, data.received - total) : 0;

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          code: genSaleCode(),
          channel: "FISICA",
          docType: data.docType,
          customerName: data.customerName || "PÚBLICO GENERAL",
          customerDoc: data.customerDoc || "",
          couponCode: data.couponCode || null,
          subtotal: Math.round(subtotal * 100) / 100,
          discount,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          paymentMethod: data.paymentMethod,
          received: data.received,
          change: Math.round(change * 100) / 100,
          userId,
          registerId: register.id,
          items: { create: saleItems },
        },
        include: { items: true },
      });

      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Registrar salida en Kardex
        const prodAfter = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALIDA",
            quantity: -item.quantity,
            reason: `Venta ${created.code}`,
            balance: prodAfter?.stock ?? 0,
          },
        });
      }

      // Incrementar uso del cupón
      if (data.couponCode) {
        await tx.coupon.updateMany({
          where: { code: data.couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Guardar/actualizar el cliente si vino con teléfono
      if (data.customerPhone && data.customerName) {
        const existing = await tx.customer.findUnique({ where: { phone: data.customerPhone } });
        if (!existing) {
          await tx.customer.create({ data: { name: data.customerName, phone: data.customerPhone } });
        }
      }
      return created;
    });

    return NextResponse.json({ ok: true, sale });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error al registrar la venta";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
