-- AlterTable
ALTER TABLE `CuotaFinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `PlanEtapa` MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Tenant` MODIFY `activo` BIT(1) NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Recibo` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pagoId` VARCHAR(36) NOT NULL,
    `numero` VARCHAR(30) NOT NULL,
    `fechaEmision` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `tipoConcepto` ENUM('CONSULTA', 'PLAN_TRATAMIENTO', 'CUOTA_FINANCIAMIENTO', 'ANTICIPO', 'OTRO') NOT NULL DEFAULT 'OTRO',
    `moneda` VARCHAR(10) NOT NULL DEFAULT 'HNL',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `impuesto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `saldoAnterior` DECIMAL(10, 2) NULL,
    `saldoPosterior` DECIMAL(10, 2) NULL,
    `notas` VARCHAR(255) NULL,
    `emitidoPorUsuario` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Recibo_pagoId_key`(`pagoId`),
    INDEX `Recibo_tenantId_idx`(`tenantId`),
    INDEX `Recibo_pagoId_idx`(`pagoId`),
    INDEX `Recibo_emitidoPorUsuario_idx`(`emitidoPorUsuario`),
    UNIQUE INDEX `Recibo_tenantId_numero_key`(`tenantId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReciboDetalle` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `reciboId` VARCHAR(36) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `referenciaTipo` VARCHAR(40) NULL,
    `referenciaId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `ReciboDetalle_tenantId_idx`(`tenantId`),
    INDEX `ReciboDetalle_reciboId_idx`(`reciboId`),
    INDEX `ReciboDetalle_referenciaTipo_referenciaId_idx`(`referenciaTipo`, `referenciaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Recibo` ADD CONSTRAINT `Recibo_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recibo` ADD CONSTRAINT `Recibo_pagoId_fkey` FOREIGN KEY (`pagoId`) REFERENCES `Pago`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recibo` ADD CONSTRAINT `Recibo_emitidoPorUsuario_fkey` FOREIGN KEY (`emitidoPorUsuario`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReciboDetalle` ADD CONSTRAINT `ReciboDetalle_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReciboDetalle` ADD CONSTRAINT `ReciboDetalle_reciboId_fkey` FOREIGN KEY (`reciboId`) REFERENCES `Recibo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
