-- AlterTable
ALTER TABLE `Consulta` ADD COLUMN `promocionId` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `CuotaFinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Paquete` MODIFY `activo` BIT(1) NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `PlanEtapa` MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Tenant` MODIFY `activo` BIT(1) NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Promocion` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precioReferencial` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `precioPromocional` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `fechaInicio` DATETIME(3) NULL,
    `fechaFin` DATETIME(3) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Promocion_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Promocion_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromocionServicio` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `promocionId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `precioAplicado` DECIMAL(10, 2) NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromocionServicio_tenantId_idx`(`tenantId`),
    INDEX `PromocionServicio_servicioId_idx`(`servicioId`),
    UNIQUE INDEX `PromocionServicio_promocionId_servicioId_key`(`promocionId`, `servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Consulta_promocionId_idx` ON `Consulta`(`promocionId`);

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_promocionId_fkey` FOREIGN KEY (`promocionId`) REFERENCES `Promocion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Promocion` ADD CONSTRAINT `Promocion_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromocionServicio` ADD CONSTRAINT `PromocionServicio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromocionServicio` ADD CONSTRAINT `PromocionServicio_promocionId_fkey` FOREIGN KEY (`promocionId`) REFERENCES `Promocion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromocionServicio` ADD CONSTRAINT `PromocionServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
