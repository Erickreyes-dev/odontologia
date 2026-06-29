CREATE TABLE `ConsultaArchivo` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `key` VARCHAR(500) NOT NULL,
  `mimeType` VARCHAR(120) NULL,
  `size` INTEGER NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ConsultaArchivo_tenantId_idx` (`tenantId`),
  INDEX `ConsultaArchivo_consultaId_idx` (`consultaId`),
  CONSTRAINT `ConsultaArchivo_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ConsultaArchivo_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PacienteArchivo` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `pacienteId` VARCHAR(36) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `key` VARCHAR(500) NOT NULL,
  `mimeType` VARCHAR(120) NULL,
  `size` INTEGER NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PacienteArchivo_tenantId_idx` (`tenantId`),
  INDEX `PacienteArchivo_pacienteId_idx` (`pacienteId`),
  CONSTRAINT `PacienteArchivo_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PacienteArchivo_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
