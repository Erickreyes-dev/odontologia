export function generatePostsAnalyticsHtml(data: {
    date: string
    leastViewed: Array<{ title: string; link: string; views: number, url?: string }>
    mostViewed: Array<{ title: string; link: string; views: number, url?: string }>
}) {
    const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n)

    return `
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Posts Analytics - ${data.date}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
    <!-- Simplified email-friendly layout with inline styles -->
    <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
            <td style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">📊 Analytics Report</h1>
                <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Reporte de Posts • ${data.date}</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 30px 20px;">
                
                <!-- Least Viewed Section -->
                <table style="width: 100%; margin-bottom: 30px;">
                    <tr>
                        <td>
                            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                                <h2 style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">📉 Posts con Menos Vistas</h2>
                                <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">Necesitan más atención</p>
                            </div>
                            
                            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f9fafb;">
                                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; width: 40px;">#</th>
                                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Título</th>
                                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; width: 80px;">Vistas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.leastViewed
            .map(
                (post, index) => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: bold; color: #6b7280; font-size: 14px;">${index + 1}</td>
                                        <td style="padding: 12px;">
                                            <a href="${post.url}" style="color: #1f2937; text-decoration: none; font-size: 14px; line-height: 1.4;" target="_blank">
                                                ${post.title}
                                            </a>
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #f59e0b; font-size: 14px;">${fmt(post.views)}</td>
                                    </tr>
                                    `,
            )
            .join("")}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Most Viewed Section -->
                <table style="width: 100%;">
                    <tr>
                        <td>
                            <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #10b981;">
                                <h2 style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">📈 Posts con Más Vistas</h2>
                                <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">Alto rendimiento</p>
                            </div>
                            
                            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                <thead>
                                    <tr style="background-color: #f9fafb;">
                                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; width: 40px;">#</th>
                                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Título</th>
                                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; width: 80px;">Vistas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.mostViewed
            .map(
                (post, index) => `
                                    <tr style="border-bottom: 1px solid #f3f4f6;">
                                        <td style="padding: 12px; font-weight: bold; color: #6b7280; font-size: 14px;">${index + 1}</td>
                                        <td style="padding: 12px;">
                                            <a href="${post.url}" style="color: #1f2937; text-decoration: none; font-size: 14px; line-height: 1.4;" target="_blank">
                                                ${post.title}
                                            </a>
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #10b981; font-size: 14px;">${fmt(post.views)}</td>
                                    </tr>
                                    `,
            )
            .join("")}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    📊 Reporte generado el ${new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
}
