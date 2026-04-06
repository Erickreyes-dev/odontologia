-- CreateTable
CREATE TABLE `HistoriaClinica` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `pacienteId` VARCHAR(36) NOT NULL,
  `antecedentesPersonales` TEXT NULL,
  `antecedentesFamiliares` TEXT NULL,
  `antecedentesQuirurgicos` TEXT NULL,
  `antecedentesGinecoObstetricos` TEXT NULL,
  `habitos` TEXT NULL,
  `hpi` TEXT NULL,
  `listaProblemasActivos` TEXT NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `HistoriaClinica_pacienteId_key`(`pacienteId`),
  INDEX `HistoriaClinica_tenantId_idx`(`tenantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlergiaPaciente` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `pacienteId` VARCHAR(36) NOT NULL,
  `alergeno` VARCHAR(150) NOT NULL,
  `reaccion` VARCHAR(255) NULL,
  `severidad` ENUM('LEVE','MODERADA','SEVERA') NOT NULL DEFAULT 'LEVE',
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `observacion` VARCHAR(255) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `AlergiaPaciente_tenantId_idx`(`tenantId`),
  INDEX `AlergiaPaciente_pacienteId_idx`(`pacienteId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SignoVital` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `fechaToma` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `tensionSistolica` INTEGER NULL,
  `tensionDiastolica` INTEGER NULL,
  `frecuenciaCardiaca` INTEGER NULL,
  `frecuenciaRespiratoria` INTEGER NULL,
  `temperatura` DECIMAL(4,1) NULL,
  `saturacionOxigeno` INTEGER NULL,
  `pesoKg` DECIMAL(5,2) NULL,
  `tallaM` DECIMAL(4,2) NULL,
  `imc` DECIMAL(5,2) NULL,
  `glicemiaCapilar` DECIMAL(6,2) NULL,
  `examenFisico` TEXT NULL,
  `alertaCritica` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `SignoVital_tenantId_idx`(`tenantId`),
  INDEX `SignoVital_consultaId_fechaToma_idx`(`consultaId`,`fechaToma`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cie10Catalogo` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `codigo` VARCHAR(15) NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Cie10Catalogo_tenantId_codigo_key`(`tenantId`,`codigo`),
  INDEX `Cie10Catalogo_tenantId_idx`(`tenantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiagnosticoConsulta` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `cie10Id` VARCHAR(36) NULL,
  `codigo` VARCHAR(15) NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `principal` BIT(1) NOT NULL DEFAULT b'0',
  `estado` ENUM('SOSPECHA','CONFIRMADO','DESCARTADO') NOT NULL DEFAULT 'SOSPECHA',
  `fechaInicio` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fechaResolucion` DATETIME(6) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `DiagnosticoConsulta_tenantId_idx`(`tenantId`),
  INDEX `DiagnosticoConsulta_consultaId_idx`(`consultaId`),
  INDEX `DiagnosticoConsulta_cie10Id_idx`(`cie10Id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicamentoCatalogo` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombreComercial` VARCHAR(150) NULL,
  `principioActivo` VARCHAR(150) NOT NULL,
  `presentacion` VARCHAR(150) NULL,
  `concentracion` VARCHAR(100) NULL,
  `viaPreferida` VARCHAR(50) NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `MedicamentoCatalogo_tenantId_idx`(`tenantId`),
  INDEX `MedicamentoCatalogo_principioActivo_idx`(`principioActivo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prescripcion` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `indicacionesGenerales` TEXT NULL,
  `recetaNumero` VARCHAR(50) NULL,
  `fechaEmision` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `Prescripcion_tenantId_idx`(`tenantId`),
  INDEX `Prescripcion_consultaId_idx`(`consultaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrescripcionItem` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `prescripcionId` VARCHAR(36) NOT NULL,
  `medicamentoId` VARCHAR(36) NULL,
  `descripcionLibre` VARCHAR(255) NULL,
  `dosis` VARCHAR(100) NOT NULL,
  `via` VARCHAR(50) NOT NULL,
  `frecuencia` VARCHAR(100) NOT NULL,
  `duracion` VARCHAR(100) NOT NULL,
  `indicacion` VARCHAR(255) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `PrescripcionItem_tenantId_idx`(`tenantId`),
  INDEX `PrescripcionItem_prescripcionId_idx`(`prescripcionId`),
  INDEX `PrescripcionItem_medicamentoId_idx`(`medicamentoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenEstudio` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `tipo` ENUM('LABORATORIO','IMAGEN','OTRO') NOT NULL,
  `estudioNombre` VARCHAR(150) NOT NULL,
  `indicacion` VARCHAR(255) NULL,
  `estado` ENUM('SOLICITADO','TOMADO','REPORTADO','REVISADO','CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
  `fechaSolicitud` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `OrdenEstudio_tenantId_idx`(`tenantId`),
  INDEX `OrdenEstudio_consultaId_idx`(`consultaId`),
  INDEX `OrdenEstudio_estado_idx`(`estado`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResultadoEstudio` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `ordenEstudioId` VARCHAR(36) NOT NULL,
  `valorTexto` TEXT NULL,
  `valorNumerico` DECIMAL(10,2) NULL,
  `unidad` VARCHAR(30) NULL,
  `rangoReferencia` VARCHAR(80) NULL,
  `archivoUrl` VARCHAR(500) NULL,
  `interpretacionClinica` TEXT NULL,
  `fechaResultado` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `ResultadoEstudio_tenantId_idx`(`tenantId`),
  INDEX `ResultadoEstudio_ordenEstudioId_idx`(`ordenEstudioId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interconsulta` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NOT NULL,
  `especialidadDestino` VARCHAR(120) NOT NULL,
  `centroDestino` VARCHAR(150) NULL,
  `motivo` VARCHAR(255) NOT NULL,
  `urgencia` VARCHAR(30) NULL,
  `documentoUrl` VARCHAR(500) NULL,
  `respuesta` TEXT NULL,
  `fechaReferencia` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fechaRespuesta` DATETIME(6) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `Interconsulta_tenantId_idx`(`tenantId`),
  INDEX `Interconsulta_consultaId_idx`(`consultaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgramaCronicoPaciente` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `pacienteId` VARCHAR(36) NOT NULL,
  `tipo` ENUM('HTA','DM2','DISLIPIDEMIA','OBESIDAD','ASMA_EPOC','OTRO') NOT NULL,
  `nombrePersonalizado` VARCHAR(150) NULL,
  `fechaInicio` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `metaClinica` VARCHAR(255) NULL,
  `observaciones` TEXT NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  INDEX `ProgramaCronicoPaciente_tenantId_idx`(`tenantId`),
  INDEX `ProgramaCronicoPaciente_pacienteId_idx`(`pacienteId`),
  INDEX `ProgramaCronicoPaciente_tipo_activo_idx`(`tipo`,`activo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HistoriaClinica` ADD CONSTRAINT `HistoriaClinica_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `HistoriaClinica` ADD CONSTRAINT `HistoriaClinica_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlergiaPaciente` ADD CONSTRAINT `AlergiaPaciente_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AlergiaPaciente` ADD CONSTRAINT `AlergiaPaciente_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SignoVital` ADD CONSTRAINT `SignoVital_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SignoVital` ADD CONSTRAINT `SignoVital_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cie10Catalogo` ADD CONSTRAINT `Cie10Catalogo_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiagnosticoConsulta` ADD CONSTRAINT `DiagnosticoConsulta_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DiagnosticoConsulta` ADD CONSTRAINT `DiagnosticoConsulta_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DiagnosticoConsulta` ADD CONSTRAINT `DiagnosticoConsulta_cie10Id_fkey` FOREIGN KEY (`cie10Id`) REFERENCES `Cie10Catalogo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicamentoCatalogo` ADD CONSTRAINT `MedicamentoCatalogo_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescripcion` ADD CONSTRAINT `Prescripcion_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Prescripcion` ADD CONSTRAINT `Prescripcion_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PrescripcionItem` ADD CONSTRAINT `PrescripcionItem_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PrescripcionItem` ADD CONSTRAINT `PrescripcionItem_prescripcionId_fkey` FOREIGN KEY (`prescripcionId`) REFERENCES `Prescripcion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PrescripcionItem` ADD CONSTRAINT `PrescripcionItem_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `MedicamentoCatalogo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenEstudio` ADD CONSTRAINT `OrdenEstudio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OrdenEstudio` ADD CONSTRAINT `OrdenEstudio_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResultadoEstudio` ADD CONSTRAINT `ResultadoEstudio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ResultadoEstudio` ADD CONSTRAINT `ResultadoEstudio_ordenEstudioId_fkey` FOREIGN KEY (`ordenEstudioId`) REFERENCES `OrdenEstudio`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interconsulta` ADD CONSTRAINT `Interconsulta_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Interconsulta` ADD CONSTRAINT `Interconsulta_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramaCronicoPaciente` ADD CONSTRAINT `ProgramaCronicoPaciente_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProgramaCronicoPaciente` ADD CONSTRAINT `ProgramaCronicoPaciente_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
