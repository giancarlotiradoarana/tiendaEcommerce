import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOpenRegister, computeExpected } from "@/lib/pos";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/panel/login");

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id!;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const salesScope = { status: "COMPLETADA" as const, createdAt: { gte: startOfDay }, ...(isAdmin ? {} : { userId }) };

  const [pendientes, ventasHoy, ventasFisica, ventasWeb, totalProductos, lowStock, openReg] = await Promise.all([
    prisma.order.count({ where: { status: "PENDIENTE" } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: salesScope }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { ...salesScope, channel: "FISICA" } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { ...salesScope, channel: "WEB" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({ where: { active: true, stock: { lte: 3 } }, orderBy: { stock: "asc" }, take: 5 }),
    getOpenRegister(userId),
  ]);

  const expected = openReg ? await computeExpected(openReg.id) : 0;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">
        Hola, {session.user.name} 👋
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        {isAdmin ? "Resumen general de tu tienda" : "Resumen de tu turno"}
      </p>

      {/* Estado de caja: solo para el vendedor (el admin no opera caja) */}
      {!isAdmin && (
        <div className={`mb-6 rounded-2xl p-5 ${openReg ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
          {openReg ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-green-400">🟢 Caja abierta</p>
                <p className="text-xs text-gray-400">
                  Efectivo esperado: <b className="text-white">S/ {expected.toFixed(2)}</b>
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/panel/pos" className="btn-gold rounded-xl px-5 py-2 text-sm">Vender 🧾</Link>
                <Link href="/panel/caja" className="rounded-xl gold-border px-5 py-2 text-sm text-gold">Ver caja</Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-yellow-400">🟡 Caja cerrada</p>
                <p className="text-xs text-gray-400">Abre la caja para empezar a vender.</p>
              </div>
              <Link href="/panel/caja" className="btn-gold rounded-xl px-5 py-2 text-sm">Abrir caja</Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={isAdmin ? "Ventas hoy (S/)" : "Mis ventas hoy (S/)"} value={(ventasHoy._sum.total || 0).toFixed(0)} accent />
        <Stat label="Nº ventas hoy" value={ventasHoy._count} />
        <Stat label="Pedidos web pendientes" value={pendientes} />
        <Stat label="Productos activos" value={totalProductos} />
      </div>

      {/* Desglose por canal */}
      <div className="mt-6">
        <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Ventas de hoy por canal</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChannelCard
            title="🏪 Tienda física"
            count={ventasFisica._count}
            total={ventasFisica._sum.total || 0}
            color="text-gold"
            ring="border-gold/30"
          />
          <ChannelCard
            title="🌐 Tienda web"
            count={ventasWeb._count}
            total={ventasWeb._sum.total || 0}
            color="text-blue-400"
            ring="border-blue-400/30"
          />
        </div>
      </div>

      {/* Gráficos (solo admin) */}
      {isAdmin && <DashboardCharts />}

      <div className="mt-8">
        <div className="card-glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-400">⚠️</span>
              <h2 className="font-semibold text-white">Stock bajo</h2>
            </div>
            {lowStock.length > 0 && (
              <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs text-yellow-400">
                {lowStock.length} producto{lowStock.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-500/5 p-4 text-sm text-green-400">
              ✅ Todo el stock está saludable.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => {
                const agotado = p.stock === 0;
                const pct = Math.min(100, Math.round((p.stock / Math.max(1, p.lowStock)) * 100));
                return (
                  <div key={p.id} className="flex items-center gap-4 rounded-xl bg-ink-card p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{p.brand} {p.name}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${agotado ? "bg-red-500" : "bg-yellow-400"}`}
                          style={{ width: `${agotado ? 100 : pct}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        agotado ? "bg-red-500/15 text-red-400" : "bg-yellow-400/15 text-yellow-400"
                      }`}
                    >
                      {agotado ? "Agotado" : `${p.stock} u.`}
                    </span>
                    {isAdmin && (
                      <Link
                        href="/panel/compras"
                        className="shrink-0 rounded-lg gold-border px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
                      >
                        Reabastecer
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ title, count, total, color, ring }: { title: string; count: number; total: number; color: string; ring: string }) {
  return (
    <div className={`card-glass rounded-2xl border ${ring} p-5`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{title}</p>
        <span className={`text-xs ${color}`}>{count} venta{count !== 1 ? "s" : ""}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>S/ {total.toFixed(2)}</p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`card-glass rounded-2xl p-5 ${accent ? "shadow-glow" : ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "gold-text" : "text-white"}`}>{value}</p>
    </div>
  );
}
