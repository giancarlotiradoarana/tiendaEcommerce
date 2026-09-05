// Utilidades de exportación (cliente): Excel (.xlsx con diseño y logo) y PDF con logo
// ExcelJS se carga de forma diferida (dynamic import) solo al exportar,
// para no pesar en la carga de las páginas del panel.

type Row = Record<string, string | number>;

const BRAND = "Aroma de Reyes";
const GOLD = "FFC9A24B";
const GOLD_SOFT = "FFF5EEDA";
const DARK = "FF14141B";

// Obtiene la URL del logo configurado en el panel (fallback a /icon.png)
async function getLogoUrl(): Promise<string> {
  try {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const d = await res.json();
      return d.logoUrl || "/icon.png";
    }
  } catch {}
  return "/icon.png";
}

// Carga el logo como base64 (para incrustarlo en Excel/PDF)
async function loadLogo(): Promise<{ dataUrl: string; ext: string } | null> {
  try {
    const url = await getLogoUrl();
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = blob.type.includes("jpeg") ? "jpeg" : blob.type.includes("webp") ? "png" : "png";
    const dataUrl: string = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return { dataUrl, ext };
  } catch {
    return null;
  }
}

/**
 * Exporta a un .xlsx real con: logo, título, tabla con encabezados dorados,
 * bordes, filas alternadas y ancho de columna automático.
 */
export async function exportToExcel(filename: string, rows: Row[], title = "Reporte") {
  if (rows.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = BRAND;
  wb.created = new Date();
  const ws = wb.addWorksheet(title, {
    views: [{ showGridLines: false }],
  });

  const headers = Object.keys(rows[0]);
  const colCount = headers.length;

  // Logo
  const logo = await loadLogo();
  let startRow = 1;
  if (logo && logo.ext !== "svg") {
    const imgId = wb.addImage({
      base64: logo.dataUrl,
      extension: logo.ext === "jpeg" ? "jpeg" : "png",
    });
    ws.addImage(imgId, {
      tl: { col: 0, row: 0 },
      ext: { width: 48, height: 48 },
    });
    ws.getRow(1).height = 40;
  }

  // Título de la marca (junto al logo)
  const titleCell = ws.getCell(1, 2);
  titleCell.value = `${BRAND}  —  ${title}`;
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: GOLD } };
  ws.mergeCells(1, 2, 1, colCount);

  // Subtítulo (fecha)
  ws.getCell(2, 2).value = `Generado: ${new Date().toLocaleString("es-PE")}`;
  ws.getCell(2, 2).font = { size: 9, italic: true, color: { argb: "FF888888" } };
  ws.mergeCells(2, 2, 2, colCount);

  startRow = 4; // fila del encabezado de la tabla

  // Encabezados
  const headerRow = ws.getRow(startRow);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: DARK }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
      left: { style: "thin", color: { argb: "FFCCCCCC" } },
      right: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });
  headerRow.height = 22;

  // Datos
  rows.forEach((r, idx) => {
    const row = ws.getRow(startRow + 1 + idx);
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.value = r[h] ?? "";
      cell.alignment = { vertical: "middle" };
      cell.border = {
        top: { style: "hair", color: { argb: "FFEEEEEE" } },
        bottom: { style: "hair", color: { argb: "FFEEEEEE" } },
        left: { style: "hair", color: { argb: "FFEEEEEE" } },
        right: { style: "hair", color: { argb: "FFEEEEEE" } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD_SOFT } };
      }
    });
  });

  // Ancho de columnas automático
  headers.forEach((h, i) => {
    let max = h.length;
    rows.forEach((r) => {
      const len = String(r[h] ?? "").length;
      if (len > max) max = len;
    });
    ws.getColumn(i + 1).width = Math.min(45, Math.max(12, max + 3));
  });



  // Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta a PDF (vía impresión del navegador) con logo y tabla estilizada. */
export async function exportToPDF(title: string, rows: Row[], subtitle = "") {
  if (rows.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }
  const logo = await loadLogo();
  const logoSrc = logo?.dataUrl || "";
  const headers = Object.keys(rows[0]);
  const win = window.open("", "_blank", "width=900,height=650");
  if (!win) return;

  const thead = headers.map((h) => `<th>${h}</th>`).join("");
  const tbody = rows
    .map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      * { font-family: Arial, sans-serif; }
      body { padding: 24px; color: #111; }
      .head { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid ${"#C9A24B"}; padding-bottom: 12px; margin-bottom: 16px; }
      .head img { width: 48px; height: 48px; }
      .head .brand { font-size: 18px; font-weight: bold; color: #A8842F; }
      .head .doc { font-size: 13px; color: #333; }
      .head .sub { font-size: 11px; color: #777; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #C9A24B; color: #14141B; }
      tr:nth-child(even) td { background: #F5EEDA; }
      @media print { @page { margin: 12mm; } }
    </style></head>
    <body>
      <div class="head">
        ${logoSrc ? `<img src="${logoSrc}" alt="logo" />` : "👑"}
        <div>
          <div class="brand">${BRAND}</div>
          <div class="doc">${title}</div>
          <div class="sub">${subtitle || "Generado el " + new Date().toLocaleString("es-PE")}</div>
        </div>
      </div>
      <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
      <script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
    </body></html>
  `);
  win.document.close();
}
