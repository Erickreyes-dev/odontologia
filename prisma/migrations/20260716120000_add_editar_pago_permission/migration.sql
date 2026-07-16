INSERT INTO `Permiso` (`id`, `nombre`, `descripcion`, `activo`, `createAt`, `updateAt`)
SELECT UUID(), 'editar_pago', 'Permiso para editar la fecha de los pagos', b'1', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `Permiso`
  WHERE `nombre` = 'editar_pago'
);
