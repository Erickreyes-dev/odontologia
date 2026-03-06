CREATE TABLE `Paquete` (
  `id` VARCHAR(36) NOT NULL,
  `nombre` VARCHAR(80) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `precio` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `maxUsuarios` INTEGER NOT NULL DEFAULT 20,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Paquete_nombre_key`(`nombre`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Tenant`
  ADD COLUMN `logoBase64` LONGTEXT NULL,
  ADD COLUMN `paqueteId` VARCHAR(36) NULL;

CREATE INDEX `Tenant_paqueteId_idx` ON `Tenant`(`paqueteId`);

ALTER TABLE `Tenant`
  ADD CONSTRAINT `Tenant_paqueteId_fkey`
  FOREIGN KEY (`paqueteId`) REFERENCES `Paquete`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
