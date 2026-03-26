ALTER TABLE `Tenant`
  ADD COLUMN `paisCodigo` VARCHAR(5) NOT NULL DEFAULT 'HN',
  ADD COLUMN `monedaCodigo` VARCHAR(10) NOT NULL DEFAULT 'HNL',
  ADD COLUMN `teamSize` VARCHAR(20) NULL,
  ADD COLUMN `authProvider` VARCHAR(20) NOT NULL DEFAULT 'password',
  ADD COLUMN `trialEndsAt` DATETIME(3) NULL,
  ADD COLUMN `paypalCustomerId` VARCHAR(120) NULL;

ALTER TABLE `Paquete`
  ADD COLUMN `precioTrimestral` DECIMAL(10, 2) NULL,
  ADD COLUMN `precioSemestral` DECIMAL(10, 2) NULL,
  ADD COLUMN `precioAnual` DECIMAL(10, 2) NULL;

CREATE TABLE `TenantInvoice` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `paqueteId` VARCHAR(36) NOT NULL,
  `periodoPlan` VARCHAR(20) NOT NULL,
  `monto` DECIMAL(10, 2) NOT NULL,
  `moneda` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `estado` VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  `paypalOrderId` VARCHAR(120) NULL,
  `paypalCaptureId` VARCHAR(120) NULL,
  `fechaFacturacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fechaPago` DATETIME(3) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `TenantInvoice_tenantId_estado_idx`(`tenantId`, `estado`),
  INDEX `TenantInvoice_paypalOrderId_idx`(`paypalOrderId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TenantInvoice`
  ADD CONSTRAINT `TenantInvoice_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `TenantInvoice_paqueteId_fkey`
    FOREIGN KEY (`paqueteId`) REFERENCES `Paquete`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
