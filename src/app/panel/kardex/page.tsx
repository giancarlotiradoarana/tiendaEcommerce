"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, ArrowUp, ArrowDown, Settings2 } from "lucide-react";

interface Move {
  id: string; type: string; quantity: number; reason: string; balance: number; createdAt: string;
  product: { name: string; brand: string };
}
interface Prod { id: string; name: string; brand: string; stock: number }

export default function KardexPage() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Prod[]>([]);
  const [selected, setSelected] = useState<Prod | null>(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stock").then((r) => r.json()).then((d) => { setMoves(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(await res.json());
  }, []);
  useEffect(() => { const t = setTimeout(() => search(query), 250); return () => clearTimeout(t); }, [query, search]);

  const save = async () => {
    setError("");
    if (!selected) { setError("Selecciona un producto"); return; }
    const n = parseInt(qty);
    if (!n) { setError("Ingresa una cantidad (usa negativo para restar)"); return; }
    const res = await fetch("/api/admin/stock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selected.id, quantity: n, reason }),
    });
    if (res.ok) { setModal(false); setSelected(null); setQty(""); setReason(""); setQuery(""); load(); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };

  const icon = (t: string) =>
    t === "ENTRADA" ? <ArrowUp className="h-4 w-4 text-green-400" />
      : t === "SALIDA" ? <ArrowDown className="h-4 w-4 text-red-400" />
      : <Settings2 className="h-4 w-4 text-yellow-400" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Kardex</h1>
            <p className="text-sm text-gray-400">Historial de movimientos de inventario</p>
          </div>
        </div>
        <button onClick={() => { setError(""); setModal(true); }} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Ajuste de stock
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : moves.length === 0 ? (
        <p className="text-gray-500">Aún no hay movimientos. Se registran con compras, ventas y ajustes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Fecha</th><th className="p-3">Producto</th><th className="p-3">Tipo</th>
                <th className="p-3">Cantidad</th><th className="p-3">Motivo</th><th className="p-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="p-3 text-gray-400">{new Date(m.createdAt).toLocaleString("es-PE")}</td>
                  <td className="p-3 text-white">{m.product.brand} {m.product.name}</td>
                  <td className="p-3"><span className="flex items-center gap-1 text-gray-300">{icon(m.type)} {m.type}</span></td>
                  <td className={`p-3 ${m.quantity >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {m.quantity >= 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td className="p-3 text-gray-400">{m.reason}</td>
                  <td className="p-3 text-white">{m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(false)} />
          <div className="card-glass relative w-full max-w-md rounded-2xl p-6">
            <h2 className="mb-1 text-xl font-bold text-white">Ajuste manual de stock</h2>
            <p className="mb-4 text-xs text-gray-400">Usa positivo para sumar, negativo para restar (mermas, roturas, correcciones).</p>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            {!selected ? (
              <>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..."
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white" />
                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)} className="block w-full rounded px-3 py-2 text-left text-sm text-white hover:bg-gold/10">
                      {p.brand} {p.name} <span className="text-xs text-gray-500">(stock: {p.stock})</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-ink-card p-3 text-sm text-white">
                  {selected.brand} {selected.name} · stock actual: <b>{selected.stock}</b>
                  <button onClick={() => setSelected(null)} className="ml-2 text-xs text-gold underline">cambiar</button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Cantidad (+/-)</label>
                  <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ej: -2 (rotura) o +5"
                    className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Motivo</label>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rotura, merma, corrección..."
                    className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
                </div>
                <button onClick={save} className="btn-gold w-full rounded-xl py-2.5">Registrar ajuste</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
