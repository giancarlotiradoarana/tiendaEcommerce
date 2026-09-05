"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileSpreadsheet, FileText, Barcode, PackagePlus } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { generateBarcode, printBarcodeLabel } from "@/lib/barcode";

interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string | null;
  description: string;
  notes: string;
  gender: string;
  cost: number;
  price: number;
  compareAt: number | null;
  stock: number;
  lowStock: number;
  imageUrl: string;
  featured: boolean;
  active: boolean;
}

const empty = {
  name: "", brand: "", sku: "", description: "", notes: "", gender: "Unisex",
  cost: "", price: "", compareAt: "", stock: "", lowStock: "3", imageUrl: "",
  featured: false, active: true,
};

export default function ProductosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(empty);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditing(null); setError(""); setModal(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, brand: p.brand, sku: p.sku || "", description: p.description, notes: p.notes,
      gender: p.gender, cost: String(p.cost ?? ""), price: String(p.price), compareAt: p.compareAt ? String(p.compareAt) : "",
      stock: String(p.stock), lowStock: String(p.lowStock), imageUrl: p.imageUrl,
      featured: p.featured, active: p.active,
    });
    setEditing(p.id); setError(""); setModal(true);
  };

  const save = async () => {
    setError("");
    if (!form.name || !form.brand || !form.price) {
      setError("Nombre, marca y precio son obligatorios");
      return;
    }
    const url = editing ? `/api/admin/products/${editing}` : "/api/admin/products";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModal(false); load(); }
    else { const d = await res.json(); setError(d.error || "Error al guardar"); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const toRows = () =>
    products.map((p) => ({
      Producto: p.name,
      Marca: p.brand,
      Género: p.gender,
      Costo: `S/ ${(p.cost ?? 0).toFixed(2)}`,
      Precio: `S/ ${p.price.toFixed(2)}`,
      Stock: p.stock,
      Estado: p.active ? "Activo" : "Oculto",
    }));
  const exportExcel = () => exportToExcel(`productos-${new Date().toISOString().slice(0, 10)}`, toRows(), "Inventario de Productos");
  const exportPDF = () => exportToPDF("Inventario de Productos", toRows());

  // Vendedor: solicitar reabastecimiento al admin
  const requestRestock = async (p: Product) => {
    const qtyStr = prompt(`¿Cuántas unidades de "${p.brand} ${p.name}" necesitas? (opcional)`, "");
    if (qtyStr === null) return; // canceló
    const note = prompt("Nota para el administrador (opcional):", "") || "";
    const res = await fetch("/api/restock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: p.id, productName: `${p.brand} ${p.name}`,
        quantity: parseInt(qtyStr) || 0, note,
      }),
    });
    if (res.ok) alert("✅ Solicitud enviada al administrador.");
    else alert("Error al enviar la solicitud.");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-sm text-gray-400">Gestiona tu catálogo y stock</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileText className="h-4 w-4" /> PDF
          </button>
          {isAdmin && (
            <button onClick={openNew} className="btn-gold rounded-xl px-5 py-2.5 text-sm">
              + Nuevo producto
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Producto</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                      <div>
                        <p className="text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gold">S/ {p.price.toFixed(0)}</td>
                  <td className="p-3">
                    <span className={p.stock === 0 ? "text-red-400" : p.stock <= p.lowStock ? "text-yellow-400" : "text-white"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${p.active ? "bg-green-400/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                      {p.active ? "Activo" : "Oculto"}
                    </span>
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(p)} className="text-gold hover:underline">Editar</button>
                        <button
                          onClick={() => {
                            if (!p.sku) { alert("Este producto no tiene código. Edítalo y genera uno primero."); return; }
                            printBarcodeLabel({ code: p.sku, name: `${p.brand} ${p.name}`, price: p.price });
                          }}
                          className="flex items-center gap-1 text-gray-300 hover:text-gold"
                          title="Imprimir etiqueta con código de barras"
                        >
                          <Barcode className="h-4 w-4" /> Etiqueta
                        </button>
                        <button onClick={() => remove(p.id)} className="text-red-400 hover:underline">Eliminar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestRestock(p)}
                        className="flex items-center gap-1 text-gold hover:underline"
                        title="Pedir más stock al administrador"
                      >
                        <PackagePlus className="h-4 w-4" /> Pedir stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(false)} />
          <div className="card-glass relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              {editing ? "Editar producto" : "Nuevo producto"}
            </h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre *" value={form.name as string} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Marca *" value={form.brand as string} onChange={(v) => setForm({ ...form, brand: v })} />
              <div>
                <label className="mb-1 block text-xs text-gray-400">Código / SKU (para pistola)</label>
                <div className="flex gap-2">
                  <input
                    value={form.sku as string}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="Escanea o genera"
                    className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sku: generateBarcode() })}
                    className="shrink-0 rounded-lg gold-border px-3 text-xs text-gold hover:bg-gold/10"
                    title="Generar código único"
                  >
                    Generar
                  </button>
                </div>
              </div>
              <Field label="Costo S/ (compra)" value={form.cost as string} onChange={(v) => setForm({ ...form, cost: v })} type="number" />
              <Field label="Precio S/ *" value={form.price as string} onChange={(v) => setForm({ ...form, price: v })} type="number" />
              <Field label="Precio antes S/" value={form.compareAt as string} onChange={(v) => setForm({ ...form, compareAt: v })} type="number" />
              <Field label="Stock" value={form.stock as string} onChange={(v) => setForm({ ...form, stock: v })} type="number" />
              <Field label="Alerta stock bajo" value={form.lowStock as string} onChange={(v) => setForm({ ...form, lowStock: v })} type="number" />
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-400">Género</label>
                <select value={form.gender as string} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white">
                  <option>Unisex</option><option>Masculino</option><option>Femenino</option>
                </select>
              </div>
              <div className="col-span-2">
                <Field label="URL de imagen" value={form.imageUrl as string} onChange={(v) => setForm({ ...form, imageUrl: v })} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-400">Notas olfativas</label>
                <input value={form.notes as string} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-400">Descripción</label>
                <textarea value={form.description as string} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.featured as boolean} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Destacado
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.active as boolean} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Activo (visible)
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-gold flex-1 rounded-xl py-2.5">Guardar</button>
              <button onClick={() => setModal(false)} className="flex-1 rounded-xl gold-border py-2.5 text-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold" />
    </div>
  );
}
