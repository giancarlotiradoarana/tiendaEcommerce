import { prisma } from "./prisma";

export function genSaleCode() {
  const d = new Date();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `V-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${n}`;
}

// Caja abierta del usuario (si existe)
export async function getOpenRegister(userId: string) {
  return prisma.cashRegister.findFirst({
    where: { userId, status: "ABIERTA" },
    orderBy: { openedAt: "desc" },
  });
}

// Calcula cuanto efectivo deberia haber en una caja
export async function computeExpected(registerId: string): Promise<number> {
  const reg = await prisma.cashRegister.findUnique({ where: { id: registerId } });
  if (!reg) return 0;

  const salesEfectivo = await prisma.sale.aggregate({
    where: { registerId, status: "COMPLETADA", paymentMethod: "EFECTIVO" },
    _sum: { total: true },
  });

  const movs = await prisma.cashMovement.findMany({ where: { registerId } });
  const movTotal = movs.reduce(
    (acc, m) => acc + (m.type === "INGRESO" ? m.amount : -m.amount),
    0
  );

  return reg.openingAmount + (salesEfectivo._sum.total || 0) + movTotal;
}

export async function getTaxRate(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { id: 1 } });
  return s?.taxRate ?? 18;
}
