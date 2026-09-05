"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Prod {
  id: string; name: string; brand: string; sku: string | null;
  price: number; stock: number; imageUrl: string;
}
interface CartLine extends Prod { quantity: number }

const PAYMENTS = ["EFECTIVO", "TARJETA", "YAPE", "PLIN", "TRANSFERENCIA"];
const DOCS = ["TICKET", "BOLETA", "NOTA"];

export default function POSPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cashOpen, setCashOpen] = useState<boolean | null>(null);

  // El admin no opera POS (solo supervisa) → lo mandamos al dashboard
  useEffect(() => {
    if (session?.user?.role === "ADMIN") router.replace("/panel");
  }, [session, router]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Prod[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [docType, setDocType] = useState("TICKET");
  const [payment, setPayment] = useState("EFECTIVO");
  const [customer, setCustomer] = useState("");
  const [customerDoc, setCustomerDoc] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("0");
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [received, setReceived] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; code: string; change: number; docType: string } | null>(null);

  // Verificar caja + traer tasa de IGV
  useEffect(() => {
    fetch("/api/cash").then((r) => r.json()).then((d) => setCashOpen(!!d.open));
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => setTaxRate(d.taxRate ?? 18)).catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const addToCart = (p: Prod) => {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) {
        if (ex.quantity >= p.stock) return prev;
        return prev.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  // Escaneo con pistola de código de barras: busca por código exacto y lo agrega.
  const scanCode = async (code: string) => {
    const c = code.trim();
    if (!c) return;
    setMsg("");
    try {
      const res = await fetch(`/api/products/barcode?code=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (data.product) {
        if (data.product.stock <= 0) {
          setMsg(`⚠️ "${data.product.brand} ${data.product.name}" sin stock`);
        } else {
          addToCart(data.product);
        }
        setQuery("");
        setResults([]);
      } else {
        // Si no hay código exacto, deja la búsqueda normal por texto
        setMsg(`No se encontró un producto con el código "${c}"`);
      }
    } catch {
      setMsg("Error al buscar el código");
    }
  };

  // Enter en el buscador = intentar escaneo por código exacto
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      // Si hay un único resultado de la búsqueda, lo agrega directo;
      // si no, intenta por código exacto (caso pistola).
      if (results.length === 1) {
        addToCart(results[0]);
        setQuery("");
        setResults([]);
      } else {
        scanCode(query);
      }
    }
  };

  const setQty = (id: string, qty: number) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i))
    );

  // Permite escribir libremente (incluso dejar vacío mientras se teclea)
  const setQtyRaw = (id: string, value: string) =>
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (value === "") return { ...i, quantity: 0 }; // temporal, se corrige al salir
        const n = parseInt(value, 10);
        if (isNaN(n)) return i;
        return { ...i, quantity: Math.min(n, i.stock) };
      })
    );

  // Al salir del campo, si quedó vacío o en 0, lo pone en 1
  const fixQty = (id: string) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id && i.quantity < 1 ? { ...i, quantity: 1 } : i))
    );

  const removeLine = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const gross = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const manualDisc = parseFloat(discount) || 0;
  const disc = Math.min(manualDisc + couponDiscount, gross);
  const net = gross - disc;
  const subtotal = net / (1 + taxRate / 100);
  const tax = net - subtotal;
  const total = net;
  const change = payment === "EFECTIVO" ? Math.max(0, (parseFloat(received) || 0) - total) : 0;

  const applyCoupon = async () => {
    setCouponMsg("");
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal: gross }),
    });
    const d = await res.json();
    if (d.valid) {
      setCouponDiscount(d.discount);
      setCouponMsg(`✅ Cupón ${d.code} aplicado (-S/ ${d.discount.toFixed(2)})`);
    } else {
      setCouponDiscount(0);
      setCouponMsg(`❌ ${d.error}`);
    }
  };

  const finalize = async () => {
    setMsg("");
    if (cart.length === 0) { setMsg("Agrega productos"); return; }
    if (payment === "EFECTIVO" && (parseFloat(received) || 0) < total) {
      setMsg("El monto recibido es menor al total"); return;
    }
    setSaving(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customer, customerDoc, customerPhone,
        couponCode: couponDiscount > 0 ? couponCode.toUpperCase() : undefined,
        docType, paymentMethod: payment,
        discount: disc, received: parseFloat(received) || 0,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setLastSale({ id: data.sale.id, code: data.sale.code, change: data.sale.change, docType: data.sale.docType });
      setCart([]); setDiscount("0"); setReceived(""); setCustomer(""); setCustomerDoc("");
      setCustomerPhone(""); setCouponCode(""); setCouponDiscount(0); setCouponMsg("");
      search(query);
    } else {
      setMsg(data.error || "Error al registrar la venta");
    }
  };

  if (cashOpen === null) return <p className="text-gray-500">Cargando...</p>;

  if (!cashOpen) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-white">Punto de Venta</h1>
        <div className="card-glass rounded-2xl p-8 text-center">
          <div className="text-5xl">🔒</div>
          <p className="mt-4 text-white">Tu caja está cerrada.</p>
          <p className="mt-1 text-sm text-gray-400">
            Cada usuario maneja su propia caja. Para vender desde el POS, primero
            abre <b>tu</b> caja con el monto inicial de tu turno.
          </p>
          <a href="/panel/caja" className="btn-gold mt-6 inline-block rounded-xl px-6 py-3">
            Abrir mi caja →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-white">🧾 Punto de Venta</h1>

      {lastSale && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-500/10 p-4">
          <div className="text-green-400">
            ✅ Venta <b>{lastSale.code}</b> registrada.
            {lastSale.change > 0 && <> Vuelto: <b>S/ {lastSale.change.toFixed(2)}</b></>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/panel/comprobante/${lastSale.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold rounded-lg px-5 py-2 text-sm"
            >
              🖨️ Imprimir {lastSale.docType === "BOLETA" ? "boleta" : lastSale.docType === "NOTA" ? "nota" : "ticket"}
            </a>
            <button onClick={() => setLastSale(null)} className="text-xs text-gray-400 underline">cerrar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Buscador + resultados */}
        <div className="lg:col-span-2">
          <div className="card-glass rounded-2xl p-4">
            <label className="mb-1 block text-xs text-gray-400">
              Buscar producto o escanear código de barras 🔫
            </label>
            <input
              autoFocus value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Escribe o escanea con la pistola..."
              className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold"
            />
            <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0}
                  className="flex w-full items-center gap-3 rounded-lg bg-ink-card p-2 text-left hover:bg-gold/10 disabled:opacity-40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{p.brand} {p.name}</p>
                    <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                  </div>
                  <span className="text-gold">S/ {p.price.toFixed(0)}</span>
                </button>
              ))}
              {results.length === 0 && <p className="p-2 text-sm text-gray-500">Sin resultados</p>}
            </div>
          </div>
        </div>

        {/* Carrito + cobro */}
        <div className="lg:col-span-3">
          <div className="card-glass rounded-2xl p-4">
            {/* Datos venta */}
            <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Documento</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white">
                  {DOCS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Cliente</label>
                <input value={customer} onChange={(e) => setCustomer(e.target.value)}
                  placeholder="PÚBLICO GENERAL"
                  className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Celular (opcional)</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="Para guardarlo"
                  className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">DNI/RUC</label>
                <input value={customerDoc} onChange={(e) => setCustomerDoc(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
              </div>
            </div>

            {/* Tabla items */}
            <div className="max-h-[35vh] overflow-y-auto rounded-lg border border-white/5">
              <table className="w-full text-sm">
                <thead className="bg-ink-card text-left text-xs text-gray-400">
                  <tr>
                    <th className="p-2">Producto</th>
                    <th className="p-2">Cant.</th>
                    <th className="p-2">Precio</th>
                    <th className="p-2">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">Carrito vacío</td></tr>
                  ) : cart.map((i) => (
                    <tr key={i.id} className="border-t border-white/5">
                      <td className="p-2 text-white">{i.brand} {i.name}</td>
                      <td className="p-2">
                        <input
                          type="number" min={1} max={i.stock}
                          value={i.quantity === 0 ? "" : i.quantity}
                          onChange={(e) => setQtyRaw(i.id, e.target.value)}
                          onBlur={() => fixQty(i.id)}
                          onFocus={(e) => e.target.select()}
                          className="w-16 rounded border border-gold/30 bg-ink px-2 py-1 text-center text-white" />
                      </td>
                      <td className="p-2 text-gray-300">{i.price.toFixed(2)}</td>
                      <td className="p-2 text-gold">{(i.price * i.quantity).toFixed(2)}</td>
                      <td className="p-2">
                        <button onClick={() => removeLine(i.id)} className="text-red-400">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Método de pago</label>
                  <select value={payment} onChange={(e) => setPayment(e.target.value)}
                    className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white">
                    {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Descuento S/</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Cupón</label>
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Código"
                      className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
                    <button type="button" onClick={applyCoupon}
                      className="shrink-0 rounded-lg gold-border px-3 text-xs text-gold hover:bg-gold/10">
                      Aplicar
                    </button>
                  </div>
                  {couponMsg && <p className="mt-1 text-xs text-gold">{couponMsg}</p>}
                </div>
                {payment === "EFECTIVO" && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Recibí S/</label>
                    <input type="number" value={received} onChange={(e) => setReceived(e.target.value)}
                      className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-ink-card p-4 text-sm">
                <Row label="Subtotal" value={subtotal} />
                <Row label={`IGV (${taxRate}%)`} value={tax} />
                <Row label="Descuento" value={-disc} />
                <div className="my-2 border-t border-gold/20" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">TOTAL</span>
                  <span className="gold-text">S/ {total.toFixed(2)}</span>
                </div>
                {payment === "EFECTIVO" && (
                  <div className="mt-2 flex justify-between text-green-400">
                    <span>Vuelto</span><span>S/ {change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {msg && <p className="mt-3 text-sm text-red-400">{msg}</p>}

            <button onClick={finalize} disabled={saving || cart.length === 0}
              className="btn-gold mt-4 w-full rounded-xl py-3 text-lg disabled:opacity-50">
              {saving ? "Procesando..." : "💵 Cobrar y generar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-gray-400">
      <span>{label}</span>
      <span>S/ {value.toFixed(2)}</span>
    </div>
  );
}
