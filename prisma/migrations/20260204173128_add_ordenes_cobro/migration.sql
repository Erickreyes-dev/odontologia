/*
  Warnings:

  - You are about to drop the column `consultaId` on the `pago` table. All the data in the column will be lost.
  - You are about to drop the column `cotizacionId` on the `pago` table. All the data in the column will be lost.
  - You are about to drop the column `financiamientoId` on the `pago` table. All the data in the column will be lost.
  - You are about to drop the column `pacienteId` on the `pago` table. All the data in the column will be lost.
  - You are about to drop the column `planTratamientoId` on the `pago` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `pago` table. All the data in the column will be lost.
  - You are about to alter the column `estado` on the `seguimiento` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(1))`.
  - A unique constraint covering the columns `[ordenCobroId]` on the table `Pago` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ordenCobroId` to the `Pago` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pago` DROP FOREIGN KEY `Pago_consultaId_fkey`;

-- DropForeignKey
ALTER TABLE `pago` DROP FOREIGN KEY `Pago_cotizacionId_fkey`;

-- DropForeignKey
ALTER TABLE `pago` DROP FOREIGN KEY `Pago_financiamientoId_fkey`;

-- DropForeignKey
ALTER TABLE `pago` DROP FOREIGN KEY `Pago_pacienteId_fkey`;

-- DropForeignKey
ALTER TABLE `pago` DROP FOREIGN KEY `Pago_planTratamientoId_fkey`;

-- DropIndex
DROP INDEX `Pago_consultaId_idx` ON `pago`;

-- DropIndex
DROP INDEX `Pago_cotizacionId_idx` ON `pago`;

-- DropIndex
DROP INDEX `Pago_financiamientoId_idx` ON `pago`;

-- DropIndex
DROP INDEX `Pago_pacienteId_idx` ON `pago`;

-- DropIndex
DROP INDEX `Pago_planTratamientoId_idx` ON `pago`;

-- AlterTable
ALTER TABLE `consulta` ADD COLUMN `fechaConsulta` DATETIME(6) NULL,
    ADD COLUMN `observacionesClinicas` TEXT NULL;

-- AlterTable
ALTER TABLE `cuotafinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `pago` DROP COLUMN `consultaId`,
    DROP COLUMN `cotizacionId`,
    DROP COLUMN `financiamientoId`,
    DROP COLUMN `pacienteId`,
    DROP COLUMN `planTratamientoId`,
    DROP COLUMN `usuarioId`,
    ADD COLUMN `ordenCobroId` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `planetapa` MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `seguimiento` MODIFY `estado` ENUM('PENDIENTE', 'REALIZADO') NOT NULL DEFAULT 'PENDIENTE';

-- CreateTable
CREATE TABLE `OrdenDeCobro` (
    `id` VARCHAR(36) NOT NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `planTratamientoId` VARCHAR(36) NULL,
    `financiamientoId` VARCHAR(36) NULL,
    `consultaId` VARCHAR(36) NULL,
    `seguimientoId` VARCHAR(36) NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `concepto` VARCHAR(255) NOT NULL,
    `estado` ENUM('PENDIENTE', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
    `fechaEmision` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `fechaPago` DATETIME(6) NULL,

    INDEX `OrdenDeCobro_pacienteId_idx`(`pacienteId`),
    INDEX `OrdenDeCobro_planTratamientoId_idx`(`planTratamientoId`),
    INDEX `OrdenDeCobro_financiamientoId_idx`(`financiamientoId`),
    INDEX `OrdenDeCobro_consultaId_idx`(`consultaId`),
    INDEX `OrdenDeCobro_seguimientoId_idx`(`seguimientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Pago_ordenCobroId_key` ON `Pago`(`ordenCobroId`);

-- CreateIndex
CREATE INDEX `Pago_ordenCobroId_idx` ON `Pago`(`ordenCobroId`);

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_ordenCobroId_fkey` FOREIGN KEY (`ordenCobroId`) REFERENCES `OrdenDeCobro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_planTratamientoId_fkey` FOREIGN KEY (`planTratamientoId`) REFERENCES `PlanTratamiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_financiamientoId_fkey` FOREIGN KEY (`financiamientoId`) REFERENCES `Financiamiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_seguimientoId_fkey` FOREIGN KEY (`seguimientoId`) REFERENCES `Seguimiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
