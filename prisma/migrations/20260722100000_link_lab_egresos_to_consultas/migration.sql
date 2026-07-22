ALTER TABLE `Egreso` ADD COLUMN `consultaId` VARCHAR(36) NULL;

CREATE INDEX `Egreso_consultaId_idx` ON `Egreso`(`consultaId`);

ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
