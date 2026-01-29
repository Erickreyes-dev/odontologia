// lib/templates/analyticReportSections.ts
export interface SectionReport {
  section: string;
  earlierViews: number;
  laterViews: number;
  diff: number;
  diffPct: number; // Infinity si earlier=0 y later>0
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function pctLabel(p: number) {
  if (p === Infinity) return "+∞";
  if (!isFinite(p) || isNaN(p)) return "—";
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
}

export function absLabel(n: number) {
  if (n === 0) return "—";
  return `${n > 0 ? "+" : "-"}${fmt(Math.abs(n))}`;
}

export function slugToTitle(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function generateAnalyticsReportHtmlSections(args: {
  sections: SectionReport[],
  earlierRange: string,
  laterRange: string
}) {
  const { sections, earlierRange, laterRange } = args;

  const grew = sections.filter(s => s.diff > 0);
  const fell = sections.filter(s => s.diff < 0);
  const topGrew = [...grew].sort((a, b) => b.diffPct - a.diffPct).slice(0, 3);
  const topFell = [...fell].sort((a, b) => a.diffPct - b.diffPct).slice(0, 3);

  const summaryLines: string[] = [];
  if (grew.length) {
    summaryLines.push(`${grew.length} sección(es) mostraron crecimiento (ej.: ${topGrew.map(s => slugToTitle(s.section)).join(', ')})`);
  }
  if (fell.length) {
    summaryLines.push(`${fell.length} sección(es) disminuyeron (ej.: ${topFell.map(s => slugToTitle(s.section)).join(', ')})`);
  }
  if (!summaryLines.length) summaryLines.push("No hubo cambios relevantes en las vistas entre períodos.");

  const dateAHtml = earlierRange;
  const dateBHtml = laterRange;

  const sectionsHtml = sections.map(s => {
    const title = slugToTitle(s.section);
    const diffSign = s.diff > 0 ? "↑" : s.diff < 0 ? "↓" : "—";
    const diffPctLabel = pctLabel(s.diffPct);
    return `
      <div class="card">
        <div class="metrics-section">
          <div class="section-title">📰 ${title}</div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:12px;">
            <div style="flex:1;min-width:160px;background:#fff;border-radius:8px;padding:12px;border:1px solid #e6eefb;">
              <div style="font-size:12px;color:#64748b;">Vistas (periodo anterior)</div>
              <div style="font-size:20px;font-weight:700;margin-top:6px;">${fmt(s.earlierViews)}</div>
            </div>
            <div style="flex:1;min-width:160px;background:#fff;border-radius:8px;padding:12px;border:1px solid #e6eefb;">
              <div style="font-size:12px;color:#64748b;">Vistas (periodo actual)</div>
              <div style="font-size:20px;font-weight:700;margin-top:6px;">${fmt(s.laterViews)}</div>
            </div>
            <div style="flex:1;min-width:160px;background:#fff;border-radius:8px;padding:12px;border:1px solid #e6eefb;">
              <div style="font-size:12px;color:#64748b;">Diferencia</div>
              <div style="font-size:20px;font-weight:700;margin-top:6px;">${absLabel(s.diff)} <span style="color:#0f172a;font-size:14px;margin-left:8px">${diffSign} ${diffPctLabel}</span></div>
            </div>
          </div>

          <div style="margin-top:12px;color:#475569;font-size:13px;">
            <strong>Resumen:</strong> ${title} ${s.diff > 0 ? `registró un aumento de ${diffPctLabel}` : s.diff < 0 ? `mostró una disminución de ${diffPctLabel}` : "se mantuvo estable"} comparando ${dateAHtml} con ${dateBHtml}.
          </div>
        </div>
      </div>
    `;
  }).join("\n");

  const tableRows = sections.map(s => {
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${slugToTitle(s.section)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${fmt(s.earlierViews)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${fmt(s.laterViews)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${absLabel(s.diff)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${pctLabel(s.diffPct)}</td>
      </tr>
    `;
  }).join("\n");

  return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Reporte de Vistas por Secciones ${dateAHtml} → ${dateBHtml}</title>
    <style>
      body{margin:0;padding:20px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;line-height:1.5;}
      .container{max-width:900px;margin:0 auto;}
      .card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:18px;overflow:hidden;padding:16px;}
      .header{padding:18px;text-align:center;background:#dbeafe;border-radius:12px 12px 0 0;}
      .title{font-size:20px;font-weight:700;margin:0;color:#0b2545;}
      .subtitle{font-size:13px;color:#0b2545;opacity:0.9;margin-top:6px;}
      .page-info{margin-top:10px;font-size:13px;color:#334155;}
      .section-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;}
      .metrics-section{margin-top:6px;}
      .footer{padding:12px 16px;background:#f1f5f9;border-radius:8px;text-align:center;color:#6b7280;font-size:12px;}
      .summary{padding:12px;background:#eef2ff;border-radius:8px;margin-bottom:12px;}
      table{width:100%;border-collapse:collapse;margin-top:12px;}
      th{background:#f8fafc;padding:12px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:600;}
      td{padding:8px 12px;border-bottom:1px solid #f3f4f6;}
      @media (max-width:768px) {
        body{padding:12px;}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card header">
        <div class="title">📊 Reporte de Vistas por Secciones</div>
        <div class="subtitle">Comparativo quincenal</div>
        <div class="page-info"><strong>${dateAHtml}</strong> → <strong>${dateBHtml}</strong></div>
      </div>

      <div class="card">
        <div class="summary">
          <strong>Resumen Ejecutivo</strong>
          <div style="margin-top:8px;color:#475569;font-size:14px;">
            ${summaryLines.join(' • ')}
          </div>
        </div>

        ${sectionsHtml}

        <div style="margin-top:10px;">
          <strong>Tabla resumen</strong>
          <table>
            <thead>
              <tr>
                <th>Sección</th>
                <th style="text-align:right">${dateAHtml}</th>
                <th style="text-align:right">${dateBHtml}</th>
                <th style="text-align:right">Diferencia</th>
                <th style="text-align:right">% Cambio</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card footer">
        📊 Reporte generado automáticamente por autogestion.tiempo.hn • ${new Date().toLocaleDateString("es-ES")}
      </div>
    </div>
  </body>
  </html>
  `;
}
