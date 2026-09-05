"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { DEPARTAMENTOS, getProvincias, getDistritos } from "@/lib/peru";

const ONLY_LETTERS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

export default function CartDrawer({ freeShippingFrom }: { freeShippingFrom: number }) {
  const { items, isOpen, setOpen, total, updateQty, removeItem, clear } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    department: "Lima",
    province: "",
    district: "",
    address: "",
    reference: "",
  });

  if (!isOpen) return null;

  const provincias = getProvincias(form.department);
  const distritos = getDistritos(form.department, form.province);

  const validate = (): string | null => {
    if (!form.customerName.trim()) return "Ingresa tu nombre";
    if (!ONLY_LETTERS.test(form.customerName.trim()))
      return "El nombre solo puede contener letras";
    if (form.phone && form.phone[0] !== "9")
      return "Ingresa un N° de celular válido (debe empezar con 9)";
    if (!/^9\d{8}$/.test(form.phone))
      return "El celular debe tener 9 dígitos y empezar con 9";
    if (!form.department) return "Selecciona el departamento";
    if (!form.province) return "Selecciona la provincia";
    if (!form.district) return "Selecciona el distrito";
    if (!form.address.trim()) return "Ingresa la dirección";
    return null;
  };

  const submit = async () => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar el pedido");
      setDone(data.code);
      clear();
      // Limpiar los datos de envío tras confirmar
      setForm({
        customerName: "",
        phone: "",
        department: "Lima",
        province: "",
        district: "",
        address: "",
        reference: "",
      });
      setCheckout(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-gold/20 p-4">
          <h2 className="gold-text text-lg font-bold">
            {done ? "¡Pedido recibido!" : checkout ? "Datos de envío" : "Tu carrito"}
          </h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-6xl">🎉</div>
            <p className="text-lg text-white">Tu pedido <b className="text-gold">{done}</b> fue registrado.</p>
            <p className="text-sm text-gray-400">
              Te contactaremos por WhatsApp para confirmar. El pago es
              <b className="text-gold"> contra entrega</b>.
            </p>
            <button onClick={() => { setOpen(false); setDone(null); setCheckout(false); }}
              className="btn-gold mt-4 rounded-xl px-6 py-2">Seguir comprando</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            Tu carrito está vacío
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {!checkout ? (
                <div className="space-y-4">
                  {items.map((i) => (
                    <div key={i.id} className="flex gap-3 rounded-xl bg-ink-card p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.imageUrl} alt={i.name} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{i.brand} {i.name}</p>
                        <p className="text-sm text-gold">S/ {i.price.toFixed(0)}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <button onClick={() => updateQty(i.id, i.quantity - 1)} className="h-6 w-6 rounded gold-border text-gold">−</button>
                          <span className="text-sm text-white">{i.quantity}</span>
                          <button onClick={() => updateQty(i.id, i.quantity + 1)} className="h-6 w-6 rounded gold-border text-gold">+</button>
                          <button onClick={() => removeItem(i.id)} className="ml-auto text-xs text-red-400">Quitar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Nombre completo *</label>
                    <input
                      value={form.customerName}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || ONLY_LETTERS.test(v)) setForm({ ...form, customerName: v });
                      }}
                      className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">N° celular / WhatsApp *</label>
                    <input
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 9);
                        setForm({ ...form, phone: v });
                      }}
                      className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-white outline-none focus:border-gold ${
                        form.phone && form.phone[0] !== "9" ? "border-red-500" : "border-gold/30"
                      }`}
                    />
                    {form.phone && form.phone[0] !== "9" ? (
                      <p className="mt-1 text-xs text-red-400">
                        Ingresa un N° de celular válido (debe empezar con 9)
                      </p>
                    ) : form.phone && form.phone.length !== 9 ? (
                      <p className="mt-1 text-xs text-yellow-400">
                        El celular debe tener 9 dígitos
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Departamento *</label>
                    <select value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value, province: "", district: "" })}
                      className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white">
                      {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Provincia *</label>
                    <select value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value, district: "" })}
                      className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white">
                      <option value="">Selecciona provincia...</option>
                      {provincias.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Distrito *</label>
                    <select value={form.district}
                      disabled={!form.province}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white disabled:opacity-50">
                      <option value="">
                        {form.province ? "Selecciona distrito..." : "Elige provincia primero"}
                      </option>
                      {distritos.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <Input label="Dirección *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                  <Input label="Referencia" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
                </div>
              )}
            </div>

            <div className="border-t border-gold/20 p-4">
              {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
              <div className="mb-3 flex justify-between text-white">
                <span>Total</span>
                <span className="text-xl font-bold text-gold">S/ {total.toFixed(2)}</span>
              </div>
              <p className="mb-3 text-xs text-gray-400">
                Pago contra entrega · Envío gratis desde S/ {freeShippingFrom.toFixed(0)}
              </p>
              {!checkout ? (
                <button onClick={() => setCheckout(true)} className="btn-gold w-full rounded-xl py-3">
                  Continuar
                </button>
              ) : (
                <button onClick={submit} disabled={loading} className="btn-gold w-full rounded-xl py-3 disabled:opacity-50">
                  {loading ? "Enviando..." : "Confirmar pedido"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-gold" />
    </div>
  );
}
