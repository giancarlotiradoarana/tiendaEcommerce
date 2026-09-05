// Utilidades de código de barras (cliente)

// Genera un código numérico único tipo EAN (12 dígitos + prefijo de tienda).
// Prefijo 200-299 está reservado para uso interno de comercios (no colisiona
// con códigos de fábrica reales).
export function generateBarcode(): string {
  const prefix = "200";
  let body = "";
  for (let i = 0; i < 9; i++) body += Math.floor(Math.random() * 10);
  return prefix + body; // 12 dígitos
}

/**
 * Imprime una etiqueta con el código de barras (usa JsBarcode).
 * Abre una ventana con la etiqueta lista para imprimir y pegar en el producto.
 */
export async function printBarcodeLabel(opts: {
  code: string;
  name: string;
  price: number;
}) {
  const JsBarcode = (await import("jsbarcode")).default;

  // Generar el SVG del código de barras en memoria
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  try {
    JsBarcode(svg, opts.code, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 6,
    });
  } catch {
    alert("El código no es válido para generar el código de barras.");
    return;
  }
  const svgString = new XMLSerializer().serializeToString(svg);

  const win = window.open("", "_blank", "width=420,height=320");
  if (!win) return;
  win.document.write(`
    <html><head><title>Etiqueta ${opts.code}</title>
    <style>
      * { font-family: Arial, sans-serif; margin: 0; }
      body { padding: 12px; text-align: center; }
      .label { display: inline-block; border: 1px dashed #999; padding: 10px 14px; border-radius: 6px; }
      .name { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
      .price { font-size: 15px; font-weight: bold; margin-top: 2px; }
      @media print { @page { margin: 6mm; } .label { border: none; } }
    </style></head>
    <body>
      <div class="label">
        <div class="name">${opts.name}</div>
        ${svgString}
        <div class="price">S/ ${opts.price.toFixed(2)}</div>
      </div>
      <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
    </body></html>
  `);
  win.document.close();
}
