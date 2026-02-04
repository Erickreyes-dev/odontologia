/*
  Warnings:

  - You are about to drop the column `servicioId` on the `planetapa` table. All the data in the column will be lost.
  - Added the required column `precioAplicado` to the `ConsultaProducto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `planetapa` DROP FOREIGN KEY `PlanEtapa_servicioId_fkey`;

-- DropIndex
DROP INDEX `PlanEtapa_servicioId_idx` ON `planetapa`;

-- AlterTable
ALTER TABLE `consultaproducto` ADD COLUMN `precioAplicado` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `cuotafinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `planetapa` DROP COLUMN `servicioId`,
    MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `PlanEtapaServicio` (
    `id` VARCHAR(36) NOT NULL,
    `etapaId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `precioAplicado` DECIMAL(10, 2) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlanEtapaServicio_etapaId_idx`(`etapaId`),
    INDEX `PlanEtapaServicio_servicioId_idx`(`servicioId`),
    UNIQUE INDEX `PlanEtapaServicio_etapaId_servicioId_key`(`etapaId`, `servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlanEtapaServicio` ADD CONSTRAINT `PlanEtapaServicio_etapaId_fkey` FOREIGN KEY (`etapaId`) REFERENCES `PlanEtapa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapaServicio` ADD CONSTRAINT `PlanEtapaServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
