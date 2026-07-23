CREATE TABLE `AuditLog` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NULL,
    `usuarioNombre` VARCHAR(150) NULL,
    `accion` VARCHAR(30) NOT NULL,
    `entidad` VARCHAR(80) NOT NULL,
    `entidadId` VARCHAR(36) NULL,
    `resumen` VARCHAR(255) NOT NULL,
    `detalle` LONGTEXT NULL,
    `valoresAntes` JSON NULL,
    `valoresDespues` JSON NULL,
    `cambios` JSON NULL,
    `metadata` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_tenantId_createAt_idx`(`tenantId`, `createAt`),
    INDEX `AuditLog_tenantId_entidad_entidadId_idx`(`tenantId`, `entidad`, `entidadId`),
    INDEX `AuditLog_tenantId_accion_idx`(`tenantId`, `accion`),
    INDEX `AuditLog_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `Permiso` (`id`, `nombre`, `descripcion`, `createAt`, `updateAt`, `activo`)
SELECT UUID(), 'ver_reporteria', 'Permiso para ver reportería y bitácora de auditoría', NOW(3), NOW(3), true
WHERE NOT EXISTS (SELECT 1 FROM `Permiso` WHERE `nombre` = 'ver_reporteria');
