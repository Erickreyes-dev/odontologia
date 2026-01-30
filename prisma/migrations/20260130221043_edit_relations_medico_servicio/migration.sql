/*
  Warnings:

  - You are about to drop the `medico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servicio` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `medico` DROP FOREIGN KEY `Medico_idEmpleado_fkey`;

-- DropForeignKey
ALTER TABLE `medico` DROP FOREIGN KEY `Medico_profesionId_fkey`;

-- DropForeignKey
ALTER TABLE `servicio` DROP FOREIGN KEY `Servicio_medicoId_fkey`;

-- DropTable
DROP TABLE `medico`;

-- DropTable
DROP TABLE `servicio`;

-- CreateTable
CREATE TABLE `Servicios` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precioBase` DECIMAL(10, 2) NOT NULL,
    `duracionMin` INTEGER NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicos` (
    `idEmpleado` VARCHAR(36) NOT NULL,
    `profesionId` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`idEmpleado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicos_Servicios` (
    `id` VARCHAR(191) NOT NULL,
    `medicoId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Medicos_Servicios_servicioId_idx`(`servicioId`),
    UNIQUE INDEX `Medicos_Servicios_medicoId_servicioId_key`(`medicoId`, `servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Medicos` ADD CONSTRAINT `Medicos_idEmpleado_fkey` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos` ADD CONSTRAINT `Medicos_profesionId_fkey` FOREIGN KEY (`profesionId`) REFERENCES `Profesion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos_Servicios` ADD CONSTRAINT `Medicos_Servicios_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos_Servicios` ADD CONSTRAINT `Medicos_Servicios_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
