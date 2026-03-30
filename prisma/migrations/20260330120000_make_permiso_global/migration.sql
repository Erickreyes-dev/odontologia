-- Migrate tenant-scoped permissions to a global permission catalog.
-- 1) Collapse duplicated Permiso rows by nombre.
-- 2) Repoint RolPermiso rows to canonical Permiso ids.
-- 3) Remove tenantId from Permiso and enforce global uniqueness by nombre.

CREATE TEMPORARY TABLE `_PermisoCanonical` (
  `nombre` VARCHAR(100) NOT NULL,
  `canonicalId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`nombre`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_PermisoCanonical` (`nombre`, `canonicalId`)
SELECT p.`nombre`, MIN(p.`id`) AS `canonicalId`
FROM `Permiso` p
GROUP BY p.`nombre`;

UPDATE `RolPermiso` rp
JOIN `Permiso` p ON p.`id` = rp.`permisoId`
JOIN `_PermisoCanonical` pc ON pc.`nombre` = p.`nombre`
SET rp.`permisoId` = pc.`canonicalId`;

DELETE p
FROM `Permiso` p
LEFT JOIN `_PermisoCanonical` pc ON pc.`canonicalId` = p.`id`
WHERE pc.`canonicalId` IS NULL;

DROP TEMPORARY TABLE `_PermisoCanonical`;

ALTER TABLE `Permiso` DROP FOREIGN KEY `Permiso_tenantId_fkey`;
DROP INDEX `Permiso_tenantId_nombre_key` ON `Permiso`;
DROP INDEX `Permiso_tenantId_idx` ON `Permiso`;
ALTER TABLE `Permiso` DROP COLUMN `tenantId`;
CREATE UNIQUE INDEX `Permiso_nombre_key` ON `Permiso`(`nombre`);
