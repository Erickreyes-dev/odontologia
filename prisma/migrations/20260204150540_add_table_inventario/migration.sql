-- AlterTable
ALTER TABLE `cuotafinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `planetapa` MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Producto` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `unidad` VARCHAR(50) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 0,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Producto_nombre_idx`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultaProducto` (
    `id` VARCHAR(36) NOT NULL,
    `consultaId` VARCHAR(36) NOT NULL,
    `productoId` VARCHAR(36) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultaProducto_consultaId_idx`(`consultaId`),
    INDEX `ConsultaProducto_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultaProducto` ADD CONSTRAINT `ConsultaProducto_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaProducto` ADD CONSTRAINT `ConsultaProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
