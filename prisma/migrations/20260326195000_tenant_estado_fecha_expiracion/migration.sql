ALTER TABLE `Tenant`
  ADD COLUMN `fechaExpiracion` DATETIME(3) NULL,
  ADD COLUMN `estado` VARCHAR(20) NOT NULL DEFAULT 'vigente';

UPDATE `Tenant`
SET
  `fechaExpiracion` = COALESCE(`trialEndsAt`, `proximoPago`),
  `estado` = CASE
    WHEN `activo` = b'0' THEN 'cancelado'
    WHEN COALESCE(`trialEndsAt`, `proximoPago`) IS NOT NULL AND COALESCE(`trialEndsAt`, `proximoPago`) > NOW(3) THEN 'vigente'
    ELSE 'expirado'
  END;
