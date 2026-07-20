-- Seed idempotente para catálogos iniciales de Contabilidad y Finanzas por tenant existente.
INSERT INTO `TipoIngreso` (`id`, `tenantId`, `nombre`, `descripcion`, `activo`, `sistema`, `createAt`, `updateAt`)
SELECT UUID(), t.`id`, v.`nombre`, v.`descripcion`, b'1', b'1', NOW(3), NOW(3)
FROM `Tenant` t
JOIN (
  SELECT 'Servicio' AS `nombre`, 'Ingresos por servicios odontológicos' AS `descripcion` UNION ALL
  SELECT 'Producto', 'Ingresos por venta de productos' UNION ALL
  SELECT 'Alquiler', 'Ingresos por alquiler' UNION ALL
  SELECT 'Otro', 'Otros ingresos'
) v
LEFT JOIN `TipoIngreso` ti ON ti.`tenantId` = t.`id` AND ti.`nombre` = v.`nombre`
WHERE ti.`id` IS NULL;

INSERT INTO `TipoEgreso` (`id`, `tenantId`, `nombre`, `categoriaEstadoResultados`, `activo`, `sistema`, `createAt`, `updateAt`)
SELECT UUID(), t.`id`, v.`nombre`, v.`categoriaEstadoResultados`, b'1', b'1', NOW(3), NOW(3)
FROM `Tenant` t
JOIN (
  SELECT 'Materiales Odontológicos' AS `nombre`, 'COSTOS' AS `categoriaEstadoResultados` UNION ALL
  SELECT 'Laboratorio', 'COSTOS' UNION ALL
  SELECT 'Equipos e Instrumentos', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Mantenimiento y Reparaciones', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Nómina', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Servicios Públicos', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Arrendamiento', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Publicidad y Marketing', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Software y Tecnología', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Papelería y Oficina', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Limpieza', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Transporte', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Capacitación', 'GASTOS_OPERACION' UNION ALL
  SELECT 'Impuestos', 'IMPUESTOS' UNION ALL
  SELECT 'Gastos Bancarios', 'GASTOS_FINANCIEROS'
) v
LEFT JOIN `TipoEgreso` te ON te.`tenantId` = t.`id` AND te.`nombre` = v.`nombre`
WHERE te.`id` IS NULL;

INSERT INTO `Permiso` (`id`, `nombre`, `descripcion`, `activo`, `createAt`, `updateAt`)
SELECT UUID(), v.`nombre`, v.`descripcion`, b'1', NOW(3), NOW(3)
FROM (
  SELECT 'ver_contabilidad' AS `nombre`, 'Permiso para ver el módulo de contabilidad' AS `descripcion` UNION ALL
  SELECT 'ver_dashboard_financiero', 'Permiso para ver el dashboard financiero' UNION ALL
  SELECT 'ver_ingresos', 'Permiso para ver ingresos contables' UNION ALL
  SELECT 'crear_ingresos', 'Permiso para crear ingresos contables' UNION ALL
  SELECT 'editar_ingresos', 'Permiso para editar ingresos contables' UNION ALL
  SELECT 'ver_honorarios', 'Permiso para ver honorarios médicos' UNION ALL
  SELECT 'editar_honorarios', 'Permiso para editar honorarios médicos' UNION ALL
  SELECT 'liquidar_honorarios', 'Permiso para liquidar honorarios médicos' UNION ALL
  SELECT 'ver_egresos', 'Permiso para ver egresos contables' UNION ALL
  SELECT 'crear_egresos', 'Permiso para crear egresos contables' UNION ALL
  SELECT 'editar_egresos', 'Permiso para editar egresos contables' UNION ALL
  SELECT 'ver_estado_resultados', 'Permiso para ver el estado de resultados' UNION ALL
  SELECT 'ver_catalogos_contables', 'Permiso para ver catálogos contables' UNION ALL
  SELECT 'editar_catalogos_contables', 'Permiso para editar catálogos contables' UNION ALL
  SELECT 'ver_equipos_instrumentos', 'Permiso para ver equipos e instrumentos' UNION ALL
  SELECT 'editar_equipos_instrumentos', 'Permiso para editar equipos e instrumentos'
) v
LEFT JOIN `Permiso` p ON p.`nombre` = v.`nombre`
WHERE p.`id` IS NULL;
