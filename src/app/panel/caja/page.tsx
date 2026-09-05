"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wallet, Lock, Unlock, Plus, TrendingUp, TrendingDown,
  Banknote, CreditCard, Store, FileSpreadsheet, FileText,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

interface Movement { id: string; type: string; amount: number; reason: string; createdAt: string }
interface Register { id: string; openingAmount: number; openedAt: string; openingNote: string | null }
interface Payment { method: string; total: number; count: number }
interface CashState {
  open: boolean; register?: Register; expected?: number; efectivo?: number;
  movements?: Movement[]; salesCount?: number; salesTotal?: number; byPayment?: Payment[];
}

export default function CajaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [state, setState] = useState<CashState | null>(null);
  const [msg, setMsg] = useState("");

  // El admin no opera caja (solo supervisa vía Historial de Cajas)
  useEffect(() => {
    if (session?.user?.role === "ADMIN") router.replace("/panel/cajas");
  }, [session, router]);
  const [opening, setOpening] = useState("");
  const [openNote, setOpenNote] = useState("");
  const [closing, setClosing] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [movType, setMovType] = useState("EGRESO");
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");
  const [closeResult, setCloseResult] = useState<{ expected: number; counted: number; diff: number } | null>(null);

  const load = () => fetch("/api/cash").then((r) => r.json()).then(setState);
  useEffect(() => { load(); }, []);

  const openCash = async () => {
    setMsg("");
    const res = await fetch("/api/cash", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingAmount: opening, note: openNote }),
    });
    if (res.ok) { setOpening(""); setOpenNote(""); load(); }
    else { const d = await res.json(); setMsg(d.error); }
  };

  const addMov = async () => {
    setMsg("");
    if (!movAmount) return;
    const res = await fetch("/api/cash/movement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: movType, amount: movAmount, reason: movReason }),
    });
    if (res.ok) { setMovAmount(""); setMovReason(""); load(); }
    else { const d = await res.json(); setMsg(d.error); }
  };

  const closeCash = async () => {
    setMsg("");
    const res = await fetch("/api/cash", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closingAmount: closing, note: closeNote }),
    });
    const d = await res.json();
    if (res.ok) {
      setCloseResult({ expected: d.register.expectedAmount, counted: d.register.closingAmount, diff: d.register.difference });
      setClosing(""); setCloseNote(""); load();
    } else setMsg(d.error);
  };

  const buildRows = () => {
    const rows: Record<string, string | number>[] = [];
    rows.push({ Concepto: "Apertura", Detalle: "", Monto: `S/ ${(state?.register?.openingAmount || 0).toFixed(2)}` });
    rows.push({ Concepto: "Ventas físicas", Detalle: `${state?.salesCount || 0} ventas`, Monto: `S/ ${(state?.salesTotal || 0).toFixed(2)}` });
    (state?.byPayment || []).forEach((p) =>
      rows.push({ Concepto: `Pago: ${p.method}`, Detalle: `${p.count} ventas`, Monto: `S/ ${p.total.toFixed(2)}` })
    );
    (state?.movements || []).forEach((m) =>
      rows.push({ Concepto: `Movimiento ${m.type}`, Detalle: m.reason || "", Monto: `${m.type === "INGRESO" ? "+" : "-"} S/ ${m.amount.toFixed(2)}` })
    );
    rows.push({ Concepto: "EFECTIVO ESPERADO", Detalle: "", Monto: `S/ ${(state?.expected || 0).toFixed(2)}` });
    return rows;
  };
  const exportExcel = () => exportToExcel(`caja-${new Date().toISOString().slice(0, 10)}`, buildRows(), "Arqueo de Caja");
  const exportPDF = () => exportToPDF("Arqueo de Caja", buildRows(), `Generado el ${new Date().toLocaleString("es-PE")}`);

  if (!state) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="h-7 w-7 text-gold" />
          <h1 className="font-display text-2xl font-bold text-white">Caja</h1>
        </div>
        {state.open && (
          <div className="flex gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
              <FileText className="h-4 w-4" /> PDF
            </button>
          </div>
        )}
      </div>
      {msg && <p className="mb-4 text-sm text-red-400">{msg}</p>}

      {closeResult && (
        <div className="mb-4 card-glass rounded-2xl p-5">
          <h2 className="mb-2 font-semibold text-white">Arqueo de cierre</h2>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="text-gray-400">Esperado</p><p className="text-lg text-white">S/ {closeResult.expected.toFixed(2)}</p></div>
            <div><p className="text-gray-400">Contado</p><p className="text-lg text-white">S/ {closeResult.counted.toFixed(2)}</p></div>
            <div>
              <p className="text-gray-400">Diferencia</p>
              <p className={`text-lg ${closeResult.diff === 0 ? "text-green-400" : closeResult.diff > 0 ? "text-blue-400" : "text-red-400"}`}>
                S/ {closeResult.diff.toFixed(2)}
              </p>
            </div>
          </div>
          <button onClick={() => setCloseResult(null)} className="mt-3 text-xs text-gold underline">cerrar</button>
        </div>
      )}

      {!state.open ? (
        <div className="card-glass rounded-2xl p-6">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Unlock className="h-5 w-5 text-gold" />
            <h2 className="font-semibold">Abrir caja</h2>
          </div>
          <p className="mb-4 text-sm text-gray-400">Ingresa el monto inicial en efectivo con el que arrancas el turno.</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Monto inicial S/</label>
              <input type="number" value={opening} onChange={(e) => setOpening(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Nota (opcional)</label>
              <input value={openNote} onChange={(e) => setOpenNote(e.target.value)}
                className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
            </div>
            <button onClick={openCash} className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-3">
              <Unlock className="h-4 w-4" /> Abrir caja
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat icon={<Wallet className="h-5 w-5" />} label="Apertura" value={`S/ ${state.register!.openingAmount.toFixed(2)}`} />
            <Stat icon={<Store className="h-5 w-5" />} label="Ventas en caja (físicas)" value={String(state.salesCount)} />
            <Stat icon={<CreditCard className="h-5 w-5" />} label="Total físico vendido" value={`S/ ${(state.salesTotal || 0).toFixed(2)}`} />
            <Stat icon={<Banknote className="h-5 w-5" />} label="Efectivo esperado" value={`S/ ${(state.expected || 0).toFixed(2)}`} accent />
          </div>

          <p className="flex items-center gap-2 text-xs text-gray-500">
            <span>Caja abierta desde {new Date(state.register!.openedAt).toLocaleString("es-PE")}.</span>
          </p>
          <div className="rounded-xl bg-blue-500/10 p-3 text-xs text-blue-300">
            ℹ️ Aquí solo cuentan las ventas <b>físicas</b> de esta caja. Las ventas web (contraentrega)
            las cobra el courier al entregar, por eso no suman al efectivo de tu cajón.
          </div>

          {/* Desglose por metodo de pago */}
          {state.byPayment && state.byPayment.length > 0 && (
            <div className="card-glass rounded-2xl p-5">
              <h2 className="mb-3 font-semibold text-white">Desglose por método de pago</h2>
              <div className="space-y-1 text-sm">
                {state.byPayment.map((p) => (
                  <div key={p.method} className="flex justify-between border-b border-white/5 py-1.5">
                    <span className="text-gray-400">{p.method} ({p.count})</span>
                    <span className="text-gold">S/ {p.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movimientos */}
          <div className="card-glass rounded-2xl p-5">
            <h2 className="mb-3 font-semibold text-white">Movimientos de caja</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <select value={movType} onChange={(e) => setMovType(e.target.value)}
                className="rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white">
                <option value="EGRESO">Egreso (salida)</option>
                <option value="INGRESO">Ingreso (entrada)</option>
              </select>
              <input type="number" placeholder="Monto" value={movAmount} onChange={(e) => setMovAmount(e.target.value)}
                className="rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
              <input placeholder="Motivo" value={movReason} onChange={(e) => setMovReason(e.target.value)}
                className="rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white" />
              <button onClick={addMov} className="flex items-center justify-center gap-1 rounded-lg gold-border py-2 text-sm text-gold hover:bg-gold/10">
                <Plus className="h-4 w-4" /> Agregar
              </button>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {state.movements?.length === 0 && <p className="text-gray-500">Sin movimientos</p>}
              {state.movements?.map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b border-white/5 py-1">
                  <span className="flex items-center gap-2 text-gray-400">
                    {m.type === "INGRESO" ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                    {m.reason || m.type}
                  </span>
                  <span className={m.type === "INGRESO" ? "text-green-400" : "text-red-400"}>
                    {m.type === "INGRESO" ? "+" : "−"} S/ {m.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cerrar caja */}
          <div className="card-glass rounded-2xl p-5">
            <div className="mb-1 flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-red-400" />
              <h2 className="font-semibold">Cerrar caja</h2>
            </div>
            <p className="mb-4 text-sm text-gray-400">Cuenta el efectivo real que hay en caja y regístralo para el arqueo.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Efectivo contado S/</label>
                <input type="number" value={closing} onChange={(e) => setClosing(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Nota de cierre</label>
                <input value={closeNote} onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
              </div>
            </div>
            <button onClick={closeCash} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/80 py-3 font-semibold text-white hover:bg-red-500">
              <Lock className="h-4 w-4" /> Cerrar caja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card-glass rounded-2xl p-4 ${accent ? "shadow-glow" : ""}`}>
      <div className={`mb-1 flex items-center gap-1.5 ${accent ? "text-gold" : "text-gray-400"}`}>
        {icon}<p className="text-xs">{label}</p>
      </div>
      <p className={`text-xl font-bold ${accent ? "gold-text" : "text-white"}`}>{value}</p>
    </div>
  );
}
