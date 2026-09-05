"use client";

import { useEffect, useState } from "react";
import { Tags, Plus, Trash2 } from "lucide-react";

interface Category { id: string; name: string; kind: string; _count: { products: number } }

export default function CategoriasPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("categoria");
  const [error, setError] = useState("");

  const load = () => { setLoading(true); fetch("/api/admin/categories").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setError("");
    if (!name.trim()) { setError("Ingresa un nombre"); return; }
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, kind }),
    });
    if (res.ok) { setName(""); load(); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar? Los productos quedarán sin categoría.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  };

  const cats = items.filter((i) => i.kind === "categoria");
  const marcas = items.filter((i) => i.kind === "marca");

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Tags className="h-7 w-7 text-gold" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Categorías / Marcas</h1>
          <p className="text-sm text-gray-400">Organiza tu catálogo</p>
        </div>
      </div>

      {/* Formulario para agregar */}
      <div className="card-glass mb-6 rounded-2xl p-4">
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Masculino, Lattafa)"
            className="min-w-[200px] flex-1 rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white" />
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white">
            <option value="categoria">Categoría</option>
            <option value="marca">Marca</option>
          </select>
          <button onClick={add} className="btn-gold flex items-center gap-1 rounded-lg px-4 py-2 text-sm">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Group title="Categorías" items={cats} onRemove={remove} />
          <Group title="Marcas" items={marcas} onRemove={remove} />
        </div>
      )}
    </div>
  );
}

function Group({ title, items, onRemove }: { title: string; items: Category[]; onRemove: (id: string) => void }) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <h2 className="mb-3 font-semibold text-white">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-gray-500">Sin registros</p> : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-ink-card px-3 py-2 text-sm">
              <span className="text-white">{c.name} <span className="text-xs text-gray-500">({c._count.products})</span></span>
              <button onClick={() => onRemove(c.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
