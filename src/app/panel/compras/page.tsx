"use client";

import { useEffect, useState, useCallback } from "react";
import { PackagePlus, Plus, Search, X } from "lucide-react";

interface Supplier { id: string; name: string }
interface Prod { id: string; name: string; brand: string; price: number; stock: number }
interface Line { productId: string; name: string; cost: string; quantity: string }
interface Purchase {
  id: string; code: string; total: number; createdAt: string;
  supplier: { name: string }; items: { id: string; name: string; quantity: number; cost: number }[];
}

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [modal, setModal] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Prod[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadPurchases = () => fetch("/api/admin/purchases").then((r) => r.json()).then(setPurchases);
  useEffect(() => {
    fetch("/api/admin/suppliers").then((r) => r.json()).then(setSuppliers);
    loadPurchases();
  }, []);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(await res.json());
  }, []);
  useEffect(() => { const t = setTimeout(() => search(query), 250); return () => clearTimeout(t); }, [query, search]);

  const addLine = (p: Prod) => {
    if (lines.some((l) => l.productId === p.id)) return;
    setLines([...lines, { productId: p.id, name: `${p.brand} ${p.name}`, cost: "", quantity: "1" }]);
    setQuery(""); setResults([]);
  };
  const updateLine = (id: string, field: "cost" | "quantity", v: string) =>
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, [field]: v } : l)));
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.productId !== id));

  const total = lines.reduce((s, l) => s + (parseFloat(l.cost) || 0) * (parseInt(l.quantity) || 0), 0);

  const save = async () => {
    setError("");
    if (!supplierId) { setError("Selecciona un proveedor"); return; }
    if (lines.length === 0) { setError("Agrega productos"); return; }
    const res = await fetch("/api/admin/purchases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId, notes,
        items: lines.map((l) => ({ productId: l.productId, cost: parseFloat(l.cost) || 0, quantity: parseInt(l.quantity) || 0 })),
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg(`✅ Compra ${d.code} registrada. Stock actualizado.`);
      setModal(false); setLines([]); setSupplierId(""); setNotes("");
      loadPurchases();
      setTimeout(() => setMsg(""), 4000);
    } else setError(d.error || "Error");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Compras</h1>
            <p className="text-sm text-gray-400">Registra mercadería y sube stock automáticamente</p>
          </div>
        </div>
        <button onClick={() => { setError(""); setModal(true); }} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Nueva compra
        </button>
      </div>

      {msg && <p className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">{msg}</p>}

      {purchases.length === 0 ? (
        <p className="text-gray-500">Aún no hay compras registradas.</p>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <div key={p.id} className="card-glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{p.code} · {p.supplier.name}</p>
                  <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString("es-PE")}</p>
                </div>
                <span className="text-gold">S/ {p.total.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {p.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(false)} />
          <div className="card-glass relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Nueva compra</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            <label className="mb-1 block text-xs text-gray-400">Proveedor *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white">
              <option value="">Selecciona...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label className="mb-1 block text-xs text-gray-400">Agregar producto</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..."
                className="w-full rounded-lg border border-gold/30 bg-ink py-2 pl-9 pr-3 text-sm text-white" />
              {results.length > 0 && query && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gold/30 bg-ink-soft">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => addLine(p)} className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-gold/10">
                      {p.brand} {p.name} <span className="text-xs text-gray-500">(stock: {p.stock})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.productId} className="flex items-center gap-2 rounded-lg bg-ink-card p-2">
                  <span className="flex-1 text-sm text-white">{l.name}</span>
                  <input type="number" placeholder="Costo" value={l.cost}
                    onChange={(e) => updateLine(l.productId, "cost", e.target.value)}
                    className="w-24 rounded border border-gold/30 bg-ink px-2 py-1 text-sm text-white" />
                  <input type="number" placeholder="Cant." value={l.quantity}
                    onChange={(e) => updateLine(l.productId, "quantity", e.target.value)}
                    className="w-16 rounded border border-gold/30 bg-ink px-2 py-1 text-sm text-white" />
                  <button onClick={() => removeLine(l.productId)} className="text-red-400"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {lines.length === 0 && <p className="text-sm text-gray-500">Sin productos agregados</p>}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-400">Notas</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-white">Total compra</span>
              <span className="text-xl font-bold text-gold">S/ {total.toFixed(2)}</span>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={save} className="btn-gold flex-1 rounded-xl py-2.5">Registrar compra</button>
              <button onClick={() => setModal(false)} className="flex-1 rounded-xl gold-border py-2.5 text-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
