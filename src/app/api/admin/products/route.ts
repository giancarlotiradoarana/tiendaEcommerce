import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, guardResponse } from "@/lib/guard";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Listar (cualquier usuario autenticado)
export async function GET() {
  try {
    await requireAuth();
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Crear (solo admin)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();

    const baseSlug = slugify(`${data.brand}-${data.name}`);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand,
        slug,
        sku: data.sku ? String(data.sku).trim() : null,
        description: data.description || "",
        notes: data.notes || "",
        gender: data.gender || "Unisex",
        cost: parseFloat(data.cost) || 0,
        price: parseFloat(data.price),
        compareAt: data.compareAt ? parseFloat(data.compareAt) : null,
        stock: parseInt(data.stock) || 0,
        lowStock: parseInt(data.lowStock) || 3,
        imageUrl: data.imageUrl || "",
        featured: !!data.featured,
        isNew: !!data.isNew,
        isBestSeller: !!data.isBestSeller,
        active: data.active !== false,
      },
    });
    return NextResponse.json(product);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
