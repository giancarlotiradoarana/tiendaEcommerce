"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, X, Check } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  notes: string;
  gender: string;
  price: number;
  compareAt: number | null;
  stock: number;
  imageUrl: string;
  featured?: boolean;
}

type Orden = "destacados" | "precio-asc" | "precio-desc" | "nombre";

export default function CatalogoTienda({ products }: { products: Product[] }) {
  const maxPrice = useMemo(
    () => Math.ceil(Math.max(100, ...products.map((p) => p.price))),
    [products]
  );

  const [q, setQ] = useState("");
  const [genders, setGenders] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [orden, setOrden] = useState<Orden>("destacados");
  const [mobileOpen, setMobileOpen] = useState(false);

  const allBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );
  const allGenders = useMemo(
    () => Array.from(new Set(products.map((p) => p.gender))),
    [products]
  );

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const texto = `${p.brand} ${p.name} ${p.notes}`.toLowerCase();
      const matchQ = !q || texto.includes(q.toLowerCase());
      const matchG = genders.length === 0 || genders.includes(p.gender);
      const matchB = brands.length === 0 || brands.includes(p.brand);
      const matchP = p.price <= priceMax;
      return matchQ && matchG && matchB && matchP;
    });
    switch (orden) {
      case "precio-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "precio-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "nombre": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, q, genders, brands, priceMax, orden]);

  const activeCount = genders.length + brands.length + (priceMax < maxPrice ? 1 : 0);
  const clearAll = () => { setGenders([]); setBrands([]); setPriceMax(maxPrice); setQ(""); };

  const Sidebar = (
    <div className="space-y-6">
      <div className="border-b border-gold/20 pb-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-gold">
        Filtros
      </div>

      {/* Ordenar */}
      <FilterBlock title="Ordenar por">
        <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}
          className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-gold">
          <option value="destacados">Relevancia</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
      </FilterBlock>

      {/* Precio */}
      <FilterBlock title="Precio">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <span>S/ 0</span>
          <span className="font-semibold text-gold">S/ {priceMax}</span>
        </div>
        <input
          type="range" min={0} max={maxPrice} value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="range-gold mt-3 w-full"
        />
      </FilterBlock>

      {/* Género */}
      <CollapsibleBlock title="Género" count={genders.length}>
        {allGenders.map((g) => (
          <CheckItem key={g} label={g} checked={genders.includes(g)}
            onClick={() => toggle(genders, setGenders, g)} />
        ))}
      </CollapsibleBlock>

      {/* Marca */}
      <CollapsibleBlock title="Marca" count={brands.length}>
        {allBrands.map((b) => (
          <CheckItem key={b} label={b} checked={brands.includes(b)}
            onClick={() => toggle(brands, setBrands, b)} />
        ))}
      </CollapsibleBlock>

      {activeCount > 0 && (
        <button onClick={clearAll}
          className="flex w-full items-center justify-center gap-1 rounded-lg gold-border py-2 text-xs text-gold hover:bg-gold/10">
          <X className="h-3 w-3" /> Limpiar filtros ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Buscador superior */}
      <div className="mb-6">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, marca o nota olfativa..."
            className="w-full rounded-full border border-gold/30 bg-ink/70 py-3 pl-12 pr-4 text-white outline-none backdrop-blur transition focus:border-gold focus:shadow-glow"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 card-glass rounded-2xl p-5">{Sidebar}</div>
        </aside>

        {/* Grilla */}
        <div className="flex-1">
          {/* Botón de filtros protagonista en móvil */}
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-gold mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-5 w-5" /> Filtrar y ordenar
            {activeCount > 0 && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-gold">{activeCount}</span>
            )}
          </button>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {filtered.length} fragancia{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="card-glass rounded-2xl py-16 text-center text-gray-400">
              <p className="text-4xl">🔍</p>
              <p className="mt-3">No encontramos fragancias con esos filtros.</p>
              <button onClick={clearAll} className="mt-4 text-sm text-gold underline">Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p, idx) => (
                <div key={p.id} className="hover-lift animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer de filtros en móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-ink-soft p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold text-white">Filtros</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            {Sidebar}
            <button onClick={() => setMobileOpen(false)} className="btn-gold mt-6 w-full rounded-xl py-3">
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      {children}
    </div>
  );
}

function CollapsibleBlock({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-white/5 pt-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-semibold text-white">
        <span>{title} {count > 0 && <span className="text-gold">({count})</span>}</span>
        <ChevronDown className={`h-4 w-4 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 space-y-1">{children}</div>}
    </div>
  );
}

function CheckItem({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-white/5">
      <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-gold bg-gold" : "border-gold/40"}`}>
        {checked && <Check className="h-3 w-3 text-ink" />}
      </span>
      {label}
    </button>
  );
}
