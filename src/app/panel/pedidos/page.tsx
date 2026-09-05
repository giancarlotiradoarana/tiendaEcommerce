"use client";

import { useEffect, useState } from "react";
import { Bell, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
interface Order {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  department: string;
  province: string;
  district: string;
  address: string;
  reference: string | null;
  notes: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUSES = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"];

const statusColors: Record<string, string> = {
  PENDIENTE: "text-yellow-400 bg-yellow-400/10",
  CONFIRMADO: "text-blue-400 bg-blue-400/10",
  ENVIADO: "text-purple-400 bg-purple-400/10",
  ENTREGADO: "text-green-400 bg-green-400/10",
  CANCELADO: "text-red-400 bg-red-400/10",
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const url = filter ? `/api/admin/orders?status=${filter}` : "/api/admin/orders";
    const res = await fetch(url);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const changeStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  };

  const toRows = () =>
    orders.map((o) => ({
      Código: o.code,
      Fecha: new Date(o.createdAt).toLocaleString("es-PE"),
      Cliente: o.customerName,
      Teléfono: o.phone,
      Ubicación: `${o.department}${o.province ? " / " + o.province : ""} / ${o.district}`,
      Dirección: o.address,
      Productos: o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
      Estado: o.status,
      Total: `S/ ${o.total.toFixed(2)}`,
    }));
  const exportExcel = () => exportToExcel(`pedidos-web-${new Date().toISOString().slice(0, 10)}`, toRows(), "Pedidos Web");
  const exportPDF = () => exportToPDF("Pedidos Web", toRows());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-gold" />
          <div>
            <h1 className="text-2xl font-bold text-white">Pedidos Web</h1>
            <p className="text-sm text-gray-400">Gestiona y actualiza el estado de cada pedido</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-4 py-1.5 text-xs ${!filter ? "bg-gold text-ink" : "gold-border text-gold"}`}
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs ${filter === s ? "bg-gold text-ink" : "gold-border text-gold"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No hay pedidos.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card-glass rounded-2xl p-4">
              <div
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <div>
                  <p className="font-semibold text-white">{o.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {o.code} · {new Date(o.createdAt).toLocaleString("es-PE")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold">S/ {o.total.toFixed(2)}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${statusColors[o.status]}`}>
                    {o.status}
                  </span>
                </div>
              </div>

              {expanded === o.id && (
                <div className="mt-4 border-t border-gold/10 pt-4 text-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-gray-400">📞 {o.phone}</p>
                      <p className="text-gray-400">📍 {o.department}{o.province ? ` / ${o.province}` : ""} / {o.district}</p>
                      <p className="text-gray-400">🏠 {o.address}</p>
                      {o.reference && <p className="text-gray-400">📌 {o.reference}</p>}
                      {o.notes && <p className="text-gray-400">📝 {o.notes}</p>}
                    </div>
                    <div>
                      <p className="mb-1 text-gray-300">Productos:</p>
                      {o.items.map((i) => (
                        <p key={i.id} className="text-gray-400">
                          {i.quantity}x {i.name} — S/ {(i.price * i.quantity).toFixed(2)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="self-center text-xs text-gray-500">Cambiar estado:</span>
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(o.id, s)}
                        disabled={o.status === s}
                        className={`rounded-lg px-3 py-1 text-xs ${
                          o.status === s
                            ? "cursor-default bg-gold/20 text-gold"
                            : "gold-border text-gray-300 hover:bg-gold/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
