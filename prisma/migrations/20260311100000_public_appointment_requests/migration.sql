-- CreateTable
CREATE TABLE `SolicitudCitaPublica` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NOT NULL,
    `fechaSolicitada` DATETIME(3) NOT NULL,
    `nombrePaciente` VARCHAR(120) NOT NULL,
    `correoPaciente` VARCHAR(150) NOT NULL,
    `telefonoPaciente` VARCHAR(25) NOT NULL,
    `motivo` VARCHAR(500) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SolicitudCitaPublica_tenantId_idx`(`tenantId`),
    INDEX `SolicitudCitaPublica_fechaSolicitada_idx`(`fechaSolicitada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SolicitudCitaPublica` ADD CONSTRAINT `SolicitudCitaPublica_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
