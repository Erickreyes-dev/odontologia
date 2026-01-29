export interface AnalyticsData {
  page: string
  totalViews: number
  totalUsers: number
  totalNewUsers: number
  usaViews: number
  usaUsers: number
  usaUserPercent: number
  date?: string
}

export function generateAnalyticsReportHtml(earlier: AnalyticsData, later: AnalyticsData): string {
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n))

  const dateA = earlier.date || new Date().toLocaleDateString("es-ES")
  const dateB = later.date || new Date().toLocaleDateString("es-ES")

  const pct = (base: number, now: number) => {
    if (!base && !now) return 0
    if (!base && now) return 100
    return ((now - base) / base) * 100
  }

  const diffViews = later.totalViews - earlier.totalViews
  const diffUsers = later.totalUsers - earlier.totalUsers
  const diffNewUsers = later.totalNewUsers - earlier.totalNewUsers

  const diffViewsPct = pct(earlier.totalViews, later.totalViews)
  const diffUsersPct = pct(earlier.totalUsers, later.totalUsers)
  const diffNewUsersPct = pct(earlier.totalNewUsers, later.totalNewUsers)

  const newUserPercentA = earlier.totalUsers ? ((earlier.totalNewUsers / earlier.totalUsers) * 100).toFixed(1) : "0.0"
  const newUserPercentB = later.totalUsers ? ((later.totalNewUsers / later.totalUsers) * 100).toFixed(1) : "0.0"

  const usaViewsPercentA = earlier.totalViews ? ((earlier.usaViews / earlier.totalViews) * 100).toFixed(1) : "0.0"
  const usaViewsPercentB = later.totalViews ? ((later.usaViews / later.totalViews) * 100).toFixed(1) : "0.0"
  const diffUsaUsers = later.usaUsers - earlier.usaUsers
  const diffUsaViews = later.usaViews - earlier.usaViews

  const diffUsaUsersPct = pct(earlier.usaUsers, later.usaUsers)
  const diffUsaViewsPct = pct(earlier.usaViews, later.usaViews)

  const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "-" : "—")
  const pctLabel = (p: number) => (!isFinite(p) || isNaN(p) ? "—" : `${p > 0 ? "+" : ""}${p.toFixed(1)}%`)
  const absLabel = (n: number) => (n === 0 ? "—" : `${n > 0 ? "+" : "-"}${fmt(Math.abs(n))}`)

  return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Comparativo Analytics ${dateA} → ${dateB}</title>
    <style>
      body{margin:0;padding:20px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;line-height:1.5;}
      .container{max-width:900px;margin:0 auto;}
      .card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:24px;overflow:hidden;}
      
      /* Header mejorado */
      .header {
  background-color: #dbeafe; /* azul suave */
  color: #0b2545;            /* texto oscuro para contraste */
  padding: 24px;
  text-align: center;
}
      .title{font-size:24px;font-weight:700;margin:0;}
      .subtitle{font-size:14px;opacity:0.9;margin-top:8px;}
      .page-info{background:rgba(255,255,255,0.1);padding:8px 16px;border-radius:20px;display:inline-block;margin-top:12px;font-size:13px;}
      
      /* Sección de resumen ejecutivo */
      .executive-summary{padding:24px;background:#f1f5f9;border-left:4px solid #3b82f6;}
      .summary-title{font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px 0;}
      .summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
      .summary-item{text-align:center;}
      .summary-value{font-size:28px;font-weight:700;color:#0f172a;}
      .summary-change{font-size:14px;margin-top:4px;}
      .summary-label{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
      
      /* Métricas principales reorganizadas */
      .metrics-section{padding:24px;}
      .section-title{font-size:20px;font-weight:600;color:#0f172a;margin:0 0 20px 0;padding-bottom:8px;border-bottom:2px solid #e2e8f0;}
      .metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
      .metric-card{background:#fafbfc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;position:relative;}
      .metric-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:#3b82f6;border-radius:8px 8px 0 0;}
      .metric-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
      .metric-title{font-size:14px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px;}
      .metric-trend{font-size:12px;padding:4px 8px;border-radius:12px;font-weight:500;}
      .trend-up{background:#dcfce7;color:#166534;}
      .trend-down{background:#fef2f2;color:#dc2626;}
      .trend-neutral{background:#f1f5f9;color:#64748b;}
      .current-value{font-size:32px;font-weight:700;color:#0f172a;margin-bottom:8px;}
      .comparison{font-size:14px;color:#64748b;}
      .change-indicator{font-weight:600;margin-left:8px;}
      .change-up{color:#059669;}
      .change-down{color:#dc2626;}
      
      /* Sección USA mejorada */
      .usa-section{padding:24px;background:#eff6ff;border-radius:8px;margin:24px;}
      .usa-title{font-size:18px;font-weight:600;color:#1e40af;margin:0 0 20px 0;display:flex;align-items:center;}
      .usa-title::before{content:'🇺🇸';margin-right:8px;font-size:20px;}
      .usa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;}
      .usa-metric{background:#fff;padding:16px;border-radius:8px;border:1px solid #dbeafe;}
      
      /* Tabla mejorada */
      .table-section{padding:24px;}
      .table-container{background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;}
      .table{width:100%;border-collapse:collapse;}
      .table th{background:#f8fafc;padding:16px 12px;text-align:left;font-weight:600;color:#374151;font-size:13px;border-bottom:1px solid #e5e7eb;}
      .table td{padding:12px;border-bottom:1px solid #f3f4f6;}
      .table tbody tr:hover{background:#f9fafb;}
      .table-metric{font-weight:500;color:#374151;}
      .table-value{text-align:right;font-weight:600;}
      .delta-up{color:#059669;font-weight:700;}
      .delta-down{color:#dc2626;font-weight:700;}
      .delta-neutral{color:#6b7280;font-weight:500;}
      
      /* Footer mejorado */
      .footer{padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;color:#6b7280;font-size:12px;}
      
      /* Responsive */
      @media (max-width: 768px) {
        body{padding:12px;}
        .metrics-grid,.summary-grid,.usa-grid{grid-template-columns:1fr;}
        .header{padding:20px 16px;}
        .title{font-size:20px;}
        .current-value{font-size:24px;}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header mejorado -->
      <div class="card">
        <div class="header">
          <div class="title">📊 Reporte de Analytics Comparativo</div>
          <div class="subtitle">Análisis de rendimiento entre períodos</div>
          <div class="page-info">
            <strong>${dateA}</strong> → <strong>${dateB}</strong>
            ${later.page && later.page !== "ALL" ? ` • Página: ${later.page}` : " • Todas las páginas"}
          </div>
        </div>
      </div>

      <!-- Resumen ejecutivo -->
      <div class="card">
        <div class="executive-summary">
          <div class="summary-title">📈 Resumen Ejecutivo</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Crecimiento en Vistas</div>
              <div class="summary-value ${diffViews >= 0 ? "change-up" : "change-down"}">${pctLabel(diffViewsPct)}</div>
              <div class="summary-change">${absLabel(diffViews)} vistas</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Crecimiento en Usuarios</div>
              <div class="summary-value ${diffUsers >= 0 ? "change-up" : "change-down"}">${pctLabel(diffUsersPct)}</div>
              <div class="summary-change">${absLabel(diffUsers)} usuarios</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Usuarios Nuevos</div>
              <div class="summary-value">${newUserPercentB}%</div>
              <div class="summary-change">del total (antes ${newUserPercentA}%)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métricas principales -->
      <div class="card">
        <div class="metrics-section">
          <div class="section-title">📊 Métricas Principales</div>
          <div class="metrics-grid">
            
            <div class="metric-card">
              <div class="metric-header">
                <div class="metric-title">👁️ Vistas Totales</div>
                <div class="metric-trend ${diffViews >= 0 ? "trend-up" : "trend-down"}">
                  ${diffViews >= 0 ? "↗️" : "↘️"} ${pctLabel(diffViewsPct)}
                </div>
              </div>
              <div class="current-value">${fmt(later.totalViews)}</div>
              <div class="comparison">
                Período anterior: ${fmt(earlier.totalViews)}
                <span class="change-indicator ${diffViews >= 0 ? "change-up" : "change-down"}">
                  ${absLabel(diffViews)}
                </span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-header">
                <div class="metric-title">👥 Usuarios Totales</div>
                <div class="metric-trend ${diffUsers >= 0 ? "trend-up" : "trend-down"}">
                  ${diffUsers >= 0 ? "↗️" : "↘️"} ${pctLabel(diffUsersPct)}
                </div>
              </div>
              <div class="current-value">${fmt(later.totalUsers)}</div>
              <div class="comparison">
                Período anterior: ${fmt(earlier.totalUsers)}
                <span class="change-indicator ${diffUsers >= 0 ? "change-up" : "change-down"}">
                  ${absLabel(diffUsers)}
                </span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-header">
                <div class="metric-title">✨ Usuarios Nuevos</div>
                <div class="metric-trend ${diffNewUsers >= 0 ? "trend-up" : "trend-down"}">
                  ${diffNewUsers >= 0 ? "↗️" : "↘️"} ${pctLabel(diffNewUsersPct)}
                </div>
              </div>
              <div class="current-value">${fmt(later.totalNewUsers)}</div>
              <div class="comparison">
                Período anterior: ${fmt(earlier.totalNewUsers)}
                <span class="change-indicator ${diffNewUsers >= 0 ? "change-up" : "change-down"}">
                  ${absLabel(diffNewUsers)}
                </span>
              </div>
              <div style="font-size:12px;color:#6b7280;margin-top:8px;">
                Representa el ${newUserPercentB}% del total de usuarios
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Sección USA -->
      <div class="card">
        <div class="usa-section">
          <div class="usa-title">Tráfico desde Estados Unidos</div>
          <div class="usa-grid">
            <div class="usa-metric">
              <div style="font-size:14px;color:#1e40af;font-weight:600;margin-bottom:8px;">👥 Usuarios USA</div>
              <div style="font-size:24px;font-weight:700;color:#0f172a;">${fmt(later.usaUsers)}</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">
                ${later.usaUserPercent}% del total • antes: ${earlier.usaUserPercent}%
              </div>
              <div style="font-size:12px;margin-top:8px;">
                <span class="${diffUsaUsers >= 0 ? "change-up" : "change-down"}">
                  ${absLabel(diffUsaUsers)} (${pctLabel(diffUsaUsersPct)})
                </span>
              </div>
            </div>

            <div class="usa-metric">
              <div style="font-size:14px;color:#1e40af;font-weight:600;margin-bottom:8px;">👁️ Vistas USA</div>
              <div style="font-size:24px;font-weight:700;color:#0f172a;">${fmt(later.usaViews)}</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">
                ${usaViewsPercentB}% del total • antes: ${usaViewsPercentA}%
              </div>
              <div style="font-size:12px;margin-top:8px;">
                <span class="${diffUsaViews >= 0 ? "change-up" : "change-down"}">
                  ${absLabel(diffUsaViews)} (${pctLabel(diffUsaViewsPct)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla detallada -->
      <div class="card">
        <div class="table-section">
          <div class="section-title">📋 Detalle Comparativo</div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th style="text-align:right">${dateA}</th>
                  <th style="text-align:right">${dateB}</th>
                  <th style="text-align:right">Diferencia</th>
                  <th style="text-align:right">% Cambio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="table-metric">👁️ Vistas totales</td>
                  <td class="table-value">${fmt(earlier.totalViews)}</td>
                  <td class="table-value">${fmt(later.totalViews)}</td>
                  <td class="table-value ${diffViews >= 0 ? "delta-up" : "delta-down"}">${absLabel(diffViews)}</td>
                  <td class="table-value ${diffViewsPct >= 0 ? "delta-up" : "delta-down"}">${pctLabel(diffViewsPct)}</td>
                </tr>
                <tr>
                  <td class="table-metric">👥 Usuarios totales</td>
                  <td class="table-value">${fmt(earlier.totalUsers)}</td>
                  <td class="table-value">${fmt(later.totalUsers)}</td>
                  <td class="table-value ${diffUsers >= 0 ? "delta-up" : "delta-down"}">${absLabel(diffUsers)}</td>
                  <td class="table-value ${diffUsersPct >= 0 ? "delta-up" : "delta-down"}">${pctLabel(diffUsersPct)}</td>
                </tr>
                <tr>
                  <td class="table-metric">✨ Usuarios nuevos</td>
                  <td class="table-value">${fmt(earlier.totalNewUsers)}</td>
                  <td class="table-value">${fmt(later.totalNewUsers)}</td>
                  <td class="table-value ${diffNewUsers >= 0 ? "delta-up" : "delta-down"}">${absLabel(diffNewUsers)}</td>
                  <td class="table-value ${diffNewUsersPct >= 0 ? "delta-up" : "delta-down"}">${pctLabel(diffNewUsersPct)}</td>
                </tr>
                <tr>
                  <td class="table-metric">🇺🇸 Usuarios USA</td>
                  <td class="table-value">${fmt(earlier.usaUsers)}</td>
                  <td class="table-value">${fmt(later.usaUsers)}</td>
                  <td class="table-value ${diffUsaUsers >= 0 ? "delta-up" : "delta-down"}">${absLabel(diffUsaUsers)}</td>
                  <td class="table-value ${diffUsaUsersPct >= 0 ? "delta-up" : "delta-down"}">${pctLabel(diffUsaUsersPct)}</td>
                </tr>
                <tr>
                  <td class="table-metric">🇺🇸 Vistas USA</td>
                  <td class="table-value">${fmt(earlier.usaViews)}</td>
                  <td class="table-value">${fmt(later.usaViews)}</td>
                  <td class="table-value ${diffUsaViews >= 0 ? "delta-up" : "delta-down"}">${absLabel(diffUsaViews)}</td>
                  <td class="table-value ${diffUsaViewsPct >= 0 ? "delta-up" : "delta-down"}">${pctLabel(diffUsaViewsPct)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="card">
        <div class="footer">
          📊 Reporte generado automáticamente por tiempo.hn • ${new Date().toLocaleDateString("es-ES")}
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}
