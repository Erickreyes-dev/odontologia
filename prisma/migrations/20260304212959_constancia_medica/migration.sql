-- AlterTable
ALTER TABLE `CuotaFinanciamiento` MODIFY `pagada` BIT(1) NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `PlanEtapa` MODIFY `programarCita` BIT(1) NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Tenant` MODIFY `activo` BIT(1) NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `ConstanciaMedica` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `medicoId` VARCHAR(36) NOT NULL,
    `fechaGeneracion` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `diasReposo` INTEGER NOT NULL,
    `motivo` TEXT NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `ConstanciaMedica_tenantId_idx`(`tenantId`),
    INDEX `ConstanciaMedica_pacienteId_idx`(`pacienteId`),
    INDEX `ConstanciaMedica_medicoId_idx`(`medicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConstanciaMedica` ADD CONSTRAINT `ConstanciaMedica_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConstanciaMedica` ADD CONSTRAINT `ConstanciaMedica_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConstanciaMedica` ADD CONSTRAINT `ConstanciaMedica_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE RESTRICT ON UPDATE CASCADE;
