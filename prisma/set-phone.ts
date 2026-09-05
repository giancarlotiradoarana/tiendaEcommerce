import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const phone = process.argv[2] || "51943085507";

async function main() {
  const s = await prisma.setting.upsert({
    where: { id: 1 },
    update: { notifyPhone: phone },
    create: { id: 1, notifyPhone: phone },
  });
  console.log(`✅ Número de notificaciones actualizado a: ${s.notifyPhone}`);
}

main().finally(() => prisma.$disconnect());
