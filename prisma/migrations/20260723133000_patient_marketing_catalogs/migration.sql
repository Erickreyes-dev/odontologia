CREATE TABLE `CatalogoConocioClinica` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `sistema` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CatalogoConocioClinica_tenantId_nombre_key`(`tenantId`, `nombre`),
  INDEX `CatalogoConocioClinica_tenantId_idx`(`tenantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CatalogoDecisionPaciente` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `sistema` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CatalogoDecisionPaciente_tenantId_nombre_key`(`tenantId`, `nombre`),
  INDEX `CatalogoDecisionPaciente_tenantId_idx`(`tenantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Paciente`
  ADD COLUMN `conocioClinicaCatalogoId` VARCHAR(36) NULL,
  ADD COLUMN `decisionAgendarCatalogoId` VARCHAR(36) NULL,
  ADD INDEX `Paciente_conocioClinicaCatalogoId_idx`(`conocioClinicaCatalogoId`),
  ADD INDEX `Paciente_decisionAgendarCatalogoId_idx`(`decisionAgendarCatalogoId`);

ALTER TABLE `CatalogoConocioClinica` ADD CONSTRAINT `CatalogoConocioClinica_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CatalogoDecisionPaciente` ADD CONSTRAINT `CatalogoDecisionPaciente_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_conocioClinicaCatalogoId_fkey` FOREIGN KEY (`conocioClinicaCatalogoId`) REFERENCES `CatalogoConocioClinica`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_decisionAgendarCatalogoId_fkey` FOREIGN KEY (`decisionAgendarCatalogoId`) REFERENCES `CatalogoDecisionPaciente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `CatalogoConocioClinica` (`id`, `tenantId`, `nombre`, `activo`, `sistema`, `createAt`, `updateAt`)
SELECT UUID(), t.`id`, v.`nombre`, true, true, NOW(3), NOW(3)
FROM `Tenant` t
JOIN (SELECT 'Redes sociales' nombre UNION ALL SELECT 'Amigos' UNION ALL SELECT 'Medio de comunicación' UNION ALL SELECT 'Otros') v
LEFT JOIN `CatalogoConocioClinica` c ON c.`tenantId` = t.`id` AND c.`nombre` = v.`nombre`
WHERE c.`id` IS NULL;

INSERT INTO `CatalogoDecisionPaciente` (`id`, `tenantId`, `nombre`, `activo`, `sistema`, `createAt`, `updateAt`)
SELECT UUID(), t.`id`, v.`nombre`, true, true, NOW(3), NOW(3)
FROM `Tenant` t
JOIN (SELECT 'Recomendación' nombre UNION ALL SELECT 'Ubicación' UNION ALL SELECT 'Precio' UNION ALL SELECT 'Promoción' UNION ALL SELECT 'Confianza en el doctor' UNION ALL SELECT 'Disponibilidad de horario' UNION ALL SELECT 'Urgencia dental' UNION ALL SELECT 'Otros') v
LEFT JOIN `CatalogoDecisionPaciente` c ON c.`tenantId` = t.`id` AND c.`nombre` = v.`nombre`
WHERE c.`id` IS NULL;
