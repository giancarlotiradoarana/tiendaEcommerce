"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Search, Calendar, ChevronLeft, ChevronRight, Store, Globe,
  Receipt, X, FileSpreadsheet, FileText,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

interface SaleItem { id: string; name: string; price: number; quantity: number; total: number }
interface Sale {
  id: string; code: string; channel: string; docType: string; status: string;
  customerName: string; total: number; paymentMethod: string; createdAt: string;
  couponCode?: string | null;
  items: SaleItem[]; user?: { name: string } | null;
}

export default function VentasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // filtros. El admin ve "Todas" por defecto; el vendedor solo "Mías".
  const [scope, setScope] = useState("mine");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (isAdmin && scope === "all") { /* todas */ } else params.set("mine", "1");
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (channel) params.set("channel", channel);
    params.set("page", String(page));
    params.set("pageSize", "10");

    const res = await fetch(`/api/sales?${params.toString()}`);
    if (res.ok) {
      const d = await res.json();
      setSales(d.sales); setTotalPages(d.totalPages); setTotal(d.total);
    }
    setLoading(false);
  }, [isAdmin, scope, q, from, to, channel, page]);

  // buscar con debounce en q; inmediato en el resto
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // resetear a página 1 cuando cambian los filtros
  useEffect(() => { setPage(1); }, [q, from, to, channel, scope]);

  // Cuando carga la sesión, si es admin ponemos "Todas" por defecto
  useEffect(() => {
    if (isAdmin) setScope("all");
  }, [isAdmin]);

  const clearFilters = () => { setQ(""); setFrom(""); setTo(""); setChannel(""); };

  const anular = async (id: string) => {
    if (!confirm("¿Anular esta venta? Se devolverá el stock. Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/sales/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "anular" }),
    });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error || "Error"); }
  };

  // Trae TODAS las ventas que cumplen los filtros actuales (para exportar)
  const fetchAllFiltered = async (): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (!(isAdmin && scope === "all")) params.set("mine", "1");
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (channel) params.set("channel", channel);
    params.set("page", "1");
    params.set("pageSize", "50");
    const res = await fetch(`/api/sales?${params.toString()}`);
    if (!res.ok) return [];
    const d = await res.json();
    return d.sales as Sale[];
  };

  const toRows = (list: Sale[]) =>
    list.map((s) => ({
      Código: s.code,
      Fecha: new Date(s.createdAt).toLocaleString("es-PE"),
      Cliente: s.customerName,
      Canal: s.channel,
      Pago: s.paymentMethod,
      Estado: s.status,
      Total: `S/ ${s.total.toFixed(2)}`,
      Vendedor: s.user?.name || "",
    }));

  const exportExcel = async () => exportToExcel(`ventas-${new Date().toISOString().slice(0, 10)}`, toRows(await fetchAllFiltered()), "Reporte de Ventas");
  const exportPDF = async () => exportToPDF("Reporte de Ventas", toRows(await fetchAllFiltered()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Receipt className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Ventas</h1>
            <p className="text-sm text-gray-400">Historial de ventas físicas y web</p>
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

      {/* Filtros */}
      <div className="card-glass mb-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs text-gray-400">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Código, cliente o pago..."
                className="w-full rounded-lg border border-gold/30 bg-ink py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Desde</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-gold/30 bg-ink py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-gold" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Hasta</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-gold/30 bg-ink py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-gold" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Canal</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}
              className="rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white">
              <option value="">Todos</option>
              <option value="FISICA">Física</option>
              <option value="WEB">Web</option>
            </select>
          </div>
          {(q || from || to || channel) && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg gold-border px-3 py-2 text-xs text-gold hover:bg-gold/10">
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}
          {isAdmin && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => setScope("mine")} className={`rounded-full px-4 py-1.5 text-xs ${scope === "mine" ? "bg-gold text-ink" : "gold-border text-gold"}`}>Mías</button>
              <button onClick={() => setScope("all")} className={`rounded-full px-4 py-1.5 text-xs ${scope === "all" ? "bg-gold text-ink" : "gold-border text-gold"}`}>Todas</button>
            </div>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-500">No se encontraron ventas con esos filtros.</p>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div key={s.id} className="card-glass rounded-2xl p-4">
              <div className="flex cursor-pointer flex-wrap items-center justify-between gap-2" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className="flex items-center gap-3">
                  {s.channel === "WEB"
                    ? <Globe className="h-5 w-5 text-blue-400" />
                    : <Store className="h-5 w-5 text-gold" />}
                  <div>
                    <p className="font-semibold text-white">{s.code} · {s.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleString("es-PE")}
                      {s.user && ` · ${s.user.name}`}
                      {s.status === "ANULADA" && " · ANULADA"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${s.channel === "WEB" ? "bg-blue-400/10 text-blue-400" : "bg-gold/15 text-gold"}`}>{s.channel}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-400">{s.paymentMethod}</span>
                  <span className={`font-semibold ${s.status === "ANULADA" ? "text-gray-500 line-through" : "text-gold"}`}>S/ {s.total.toFixed(2)}</span>
                </div>
              </div>
              {expanded === s.id && (
                <div className="mt-3 border-t border-gold/10 pt-3 text-sm">
                  {s.items.map((i) => (
                    <p key={i.id} className="text-gray-400">{i.quantity}x {i.name} — S/ {i.total.toFixed(2)}</p>
                  ))}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Documento: {s.docType}{s.couponCode ? ` · Cupón: ${s.couponCode}` : ""}</span>
                    <div className="flex items-center gap-3">
                      <a href={`/panel/comprobante/${s.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline">🖨️ Reimprimir comprobante</a>
                      {s.status !== "ANULADA" && s.channel === "FISICA" && (
                        <button onClick={() => anular(s.id)} className="text-xs text-red-400 hover:underline">
                          ✕ Anular venta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && total > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
          <span>{total} venta{total !== 1 ? "s" : ""} · página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg gold-border px-3 py-1.5 text-gold disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg gold-border px-3 py-1.5 text-gold disabled:opacity-30">
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
