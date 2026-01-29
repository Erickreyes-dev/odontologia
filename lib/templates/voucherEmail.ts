import { VoucherDto } from "@/app/(protected)/contabilidad/generar-planilla/types"


export function generateVoucherEmailHtml(v: VoucherDto): string {
  const fecha = new Date(v.fechaPago).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  // Separar bonos y deducciones
  const bonos = v.detalles.filter((d) => d.categoria === "BONO")
  const deducciones = v.detalles.filter((d) => d.categoria === "DEDUCCION")

  // Calcular totales
  const totalBonosNumber = bonos.reduce((sum, b) => sum + Number(b.monto), 0)
  const totalDeduccionesNumber = deducciones.reduce((sum, d) => sum + Number(d.monto), 0)

  const totalBonos = totalBonosNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const totalDeducciones = totalDeduccionesNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Generar HTML para bonos
  const bonosHtml = bonos
    .map((b) => {
      const montoFormateado = Number(b.monto).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
            ${b.ajusteTipoNombre}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #16a34a; font-size: 14px;">
            +L. ${montoFormateado}
          </td>
        </tr>
      `
    })
    .join("")

  // Generar HTML para deducciones
  const deduccionesHtml = deducciones
    .map((d) => {
      const montoFormateado = Number(d.monto).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
            ${d.ajusteTipoNombre}
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #dc2626; font-size: 14px;">
            -L. ${montoFormateado}
          </td>
        </tr>
      `
    })
    .join("")

  const salarioDiarioFormateado = v.salarioDiario.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const salarioMensualFormateado = v.salarioMensual.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const netoPagarFormateado = v.netoPagar.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo de Pago</title>
      <style>
        @media only screen and (max-width: 600px) {
          .stack-on-mobile td {
            display: block !important;
            width: 100% !important;
          }
          .stack-on-mobile td > div {
            padding: 12px !important;
          }
          .summary-grid td {
            display: block !important;
            width: 100% !important;
            margin-bottom: 8px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td style="padding: 20px 10px;">
            
            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: #1e40af; color: #ffffff; padding: 30px 24px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff;">Recibo de Pago</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #bfdbfe;">Comprobante de Nómina</p>
                </td>
              </tr>

              <!-- Employee Info -->
              <tr>
                <td style="padding: 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <table class="stack-on-mobile" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="50%" style="padding: 0 8px 0 0; vertical-align: top;">
                        <div style="background: #ffffff; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Empleado</p>
                          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${v.empleadoNombre}</p>
                        </div>
                      </td>
                      <td width="50%" style="padding: 0 0 0 8px; vertical-align: top;">
                        <div style="background: #ffffff; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981;">
                          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Fecha de Pago</p>
                          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${fecha}</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Salary Details -->
              <tr>
                <td style="padding: 24px;">
                  <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1e293b;">Detalle Salarial</h2>
                  
                  <!-- Salary Grid -->
                  <table class="stack-on-mobile" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td width="50%" style="padding: 0 8px 0 0; vertical-align: top;">
                        <div style="background: #eff6ff; padding: 20px; border-radius: 6px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; color: #2563eb; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Días Trabajados</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #1d4ed8;">${v.diasTrabajados}</p>
                        </div>
                      </td>
                      <td width="50%" style="padding: 0 0 0 8px; vertical-align: top;">
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; color: #16a34a; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Salario Diario</p>
                          <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #15803d;">L. ${salarioDiarioFormateado}</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Monthly Salary -->
                  <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #64748b; font-size: 14px;">Salario Mensual</td>
                        <td style="text-align: right; font-weight: 600; color: #1e293b; font-size: 16px;">L. ${salarioMensualFormateado}</td>
                      </tr>
                    </table>
                  </div>

                  ${bonos.length > 0 || deducciones.length > 0
      ? `
                  <!-- Summary Grid -->
                  <table class="summary-grid" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      ${bonos.length > 0
        ? `
                      <td width="33.33%" style="padding: 0 4px 0 0; vertical-align: top;">
                        <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #bbf7d0;">
                          <p style="margin: 0; font-size: 12px; color: #16a34a; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Total Bonos</p>
                          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #15803d;">+L. ${totalBonos}</p>
                        </div>
                      </td>
                      `
        : ""
      }
                      ${deducciones.length > 0
        ? `
                      <td width="33.33%" style="padding: 0 4px; vertical-align: top;">
                        <div style="background: #fef2f2; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #fecaca;">
                          <p style="margin: 0; font-size: 12px; color: #dc2626; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Total Deducciones</p>
                          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #dc2626;">-L. ${totalDeducciones}</p>
                        </div>
                      </td>
                      `
        : ""
      }
                      <td width="33.33%" style="padding: 0 0 0 4px; vertical-align: top;">
                        <div style="background: #eff6ff; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #bfdbfe;">
                          <p style="margin: 0; font-size: 12px; color: #2563eb; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Neto Final</p>
                          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #1d4ed8;">L. ${netoPagarFormateado}</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  `
      : ""
    }

                  <!-- Net Pay - Highlighted -->
                  <div style="background: #059669; color: #ffffff; padding: 24px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 1px;">NETO A PAGAR</p>
                    <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: bold; color: #ffffff;">L. ${netoPagarFormateado}</p>
                  </div>
                </td>
              </tr>

              ${bonos.length > 0
      ? `
              <!-- Bonos Section -->
              <tr>
                <td style="padding: 24px; background-color: #f0fdf4;">
                  <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #15803d;">Bonos y Beneficios</h3>
                  
                  <div style="background: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #bbf7d0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <thead>
                        <tr style="background: #f0fdf4;">
                          <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #15803d; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                            Concepto
                          </th>
                          <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #15803d; font-size: 14px; border-bottom: 1px solid #bbf7d0;">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        ${bonosHtml}
                      </tbody>
                      <tfoot>
                        <tr style="background: #f0fdf4;">
                          <td style="padding: 12px 8px; font-weight: 600; color: #15803d; font-size: 14px; border-top: 2px solid #bbf7d0;">
                            Total Bonos
                          </td>
                          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #15803d; font-size: 16px; border-top: 2px solid #bbf7d0;">
                            +L. ${totalBonos}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </td>
              </tr>
              `
      : ""
    }

              ${deducciones.length > 0
      ? `
              <!-- Deducciones Section -->
              <tr>
                <td style="padding: 24px; background-color: #fef2f2;">
                  <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #dc2626;">Deducciones</h3>
                  
                  <div style="background: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #fecaca;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <thead>
                        <tr style="background: #fef2f2;">
                          <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #dc2626; font-size: 14px; border-bottom: 1px solid #fecaca;">
                            Concepto
                          </th>
                          <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #dc2626; font-size: 14px; border-bottom: 1px solid #fecaca;">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        ${deduccionesHtml}
                      </tbody>
                      <tfoot>
                        <tr style="background: #fef2f2;">
                          <td style="padding: 12px 8px; font-weight: 600; color: #dc2626; font-size: 14px; border-top: 2px solid #fecaca;">
                            Total Deducciones
                          </td>
                          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #dc2626; font-size: 16px; border-top: 2px solid #fecaca;">
                            -L. ${totalDeducciones}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </td>
              </tr>
              `
      : ""
    }

              ${v.observaciones
      ? `
              <!-- Observaciones -->
              <tr>
                <td style="padding: 24px; border-top: 1px solid #e2e8f0;">
                  <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1e293b;">Observaciones</h4>
                  <div style="background: #fefce8; padding: 16px; border-radius: 6px; border-left: 4px solid #eab308;">
                    <p style="margin: 0; color: #713f12; font-size: 14px; line-height: 1.5;">${v.observaciones}</p>
                  </div>
                </td>
              </tr>
              `
      : ""
    }

              <!-- Footer -->
              <tr>
                <td style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
                    Este es un correo automático generado por el sistema de nómina.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    Por favor, conserve este comprobante para sus registros.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
