"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SaleItem { id: string; name: string; price: number; quantity: number; total: number }
interface Sale {
  code: string; docType: string; docSerie: string; docNumber: string;
  customerName: string; customerDoc: string;
  subtotal: number; discount: number; tax: number; total: number;
  paymentMethod: string; received: number; change: number;
  createdAt: string; items: SaleItem[]; user?: { name: string } | null;
}
interface Setting {
  storeName: string; ruc: string; currency: string; taxRate: number; logoUrl?: string;
}

const docTitle: Record<string, string> = {
  BOLETA: "BOLETA DE VENTA",
  TICKET: "TICKET DE VENTA",
  NOTA: "NOTA DE VENTA",
};

export default function ComprobantePage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setSale(d.sale); setSetting(d.setting); })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (sale) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [sale]);

  if (notFound) return <div className="p-8 text-center text-red-500">Comprobante no encontrado</div>;
  if (!sale) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  const cur = setting?.currency || "S/";

  return (
    <div className="receipt-wrap">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        .receipt-wrap { position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: #fff; color: #000; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
        .receipt { width: 300px; font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
        .receipt h1 { font-size: 16px; text-align: center; margin: 0; font-weight: bold; }
        .receipt .center { text-align: center; }
        .receipt .row { display: flex; justify-content: space-between; }
        .receipt hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
        .receipt table { width: 100%; border-collapse: collapse; }
        .receipt th, .receipt td { text-align: left; padding: 1px 0; font-size: 11px; }
        .receipt .r { text-align: right; }
        .receipt .total { font-size: 15px; font-weight: bold; }
      `}</style>

      <div className="receipt">
        {setting?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={setting.logoUrl} alt="logo" style={{ display: "block", margin: "0 auto 6px", height: 56, objectFit: "contain" }} />
        )}
        <h1>{setting?.storeName || "Aroma de Reyes"}</h1>
        <p className="center" style={{ margin: "2px 0" }}>Perfumería Árabe de Lujo</p>
        {setting?.ruc ? <p className="center" style={{ margin: "2px 0" }}>RUC: {setting.ruc}</p> : null}
        <hr />
        <p className="center" style={{ fontWeight: "bold", margin: "2px 0" }}>
          {docTitle[sale.docType] || "COMPROBANTE"}
        </p>
        <p className="center" style={{ margin: "2px 0" }}>{sale.code}</p>
        <hr />
        <div className="row"><span>Fecha:</span><span>{new Date(sale.createdAt).toLocaleString("es-PE")}</span></div>
        <div className="row"><span>Cliente:</span><span>{sale.customerName}</span></div>
        {sale.customerDoc ? <div className="row"><span>DNI/RUC:</span><span>{sale.customerDoc}</span></div> : null}
        {sale.user ? <div className="row"><span>Atendió:</span><span>{sale.user.name}</span></div> : null}
        <hr />
        <table>
          <thead>
            <tr><th>Cant</th><th>Producto</th><th className="r">Importe</th></tr>
          </thead>
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.id}>
                <td>{i.quantity}</td>
                <td>{i.name}</td>
                <td className="r">{i.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        <div className="row"><span>Subtotal</span><span>{cur} {sale.subtotal.toFixed(2)}</span></div>
        <div className="row"><span>IGV ({setting?.taxRate ?? 18}%)</span><span>{cur} {sale.tax.toFixed(2)}</span></div>
        {sale.discount > 0 && <div className="row"><span>Descuento</span><span>- {cur} {sale.discount.toFixed(2)}</span></div>}
        <div className="row total"><span>TOTAL</span><span>{cur} {sale.total.toFixed(2)}</span></div>
        <hr />
        <div className="row"><span>Pago ({sale.paymentMethod})</span><span></span></div>
        {sale.paymentMethod === "EFECTIVO" && (
          <>
            <div className="row"><span>Recibido</span><span>{cur} {sale.received.toFixed(2)}</span></div>
            <div className="row"><span>Vuelto</span><span>{cur} {sale.change.toFixed(2)}</span></div>
          </>
        )}
        <hr />
        <p className="center" style={{ margin: "6px 0" }}>¡Gracias por su compra!</p>
        <p className="center" style={{ fontSize: "10px" }}>Vuelva pronto 👑</p>
      </div>

      <div className="no-print mt-6 flex gap-3">
        <button onClick={() => window.print()} className="rounded-lg bg-black px-6 py-2 text-white">
          🖨️ Imprimir
        </button>
        <button onClick={() => window.close()} className="rounded-lg border border-gray-400 px-6 py-2 text-gray-700">
          Cerrar
        </button>
      </div>
    </div>
  );
}
