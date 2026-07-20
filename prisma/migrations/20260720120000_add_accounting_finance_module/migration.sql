ALTER TABLE `Servicios` ADD COLUMN `requiereLaboratorio` BIT(1) NOT NULL DEFAULT b'0';
ALTER TABLE `Medicos_Servicios` ADD COLUMN `porcentajeHonorario` DECIMAL(5,2) NOT NULL DEFAULT 0.00, ADD COLUMN `activo` BIT(1) NOT NULL DEFAULT b'1';

CREATE TABLE `TipoIngreso` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `sistema` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TipoIngreso_tenantId_nombre_key`(`tenantId`, `nombre`),
  INDEX `TipoIngreso_tenantId_idx`(`tenantId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Ingreso` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `tipoIngresoId` VARCHAR(36) NOT NULL,
  `pagoId` VARCHAR(36) NULL,
  `pacienteId` VARCHAR(36) NULL,
  `medicoId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NULL,
  `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `concepto` VARCHAR(255) NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `metodoPago` ENUM('EFECTIVO','TARJETA','TRANSFERENCIA','SEGURO','OTRO') NULL,
  `comentario` VARCHAR(255) NULL,
  `origen` VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  `editable` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Ingreso_pagoId_key`(`pagoId`),
  INDEX `Ingreso_tenantId_idx`(`tenantId`),
  INDEX `Ingreso_fecha_idx`(`fecha`),
  INDEX `Ingreso_tipoIngresoId_idx`(`tipoIngresoId`),
  INDEX `Ingreso_pacienteId_idx`(`pacienteId`),
  INDEX `Ingreso_medicoId_idx`(`medicoId`),
  INDEX `Ingreso_consultaId_idx`(`consultaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HonorarioMedico` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `ingresoId` VARCHAR(36) NOT NULL,
  `medicoId` VARCHAR(36) NOT NULL,
  `pacienteId` VARCHAR(36) NULL,
  `consultaId` VARCHAR(36) NULL,
  `servicioId` VARCHAR(36) NULL,
  `totalServicio` DECIMAL(10,2) NOT NULL,
  `porcentaje` DECIMAL(5,2) NOT NULL,
  `comision` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('PENDIENTE','LIQUIDADO') NOT NULL DEFAULT 'PENDIENTE',
  `comentario` VARCHAR(255) NULL,
  `fechaGenerado` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fechaLiquidado` DATETIME(6) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `HonorarioMedico_ingresoId_medicoId_servicioId_key`(`ingresoId`, `medicoId`, `servicioId`),
  INDEX `HonorarioMedico_tenantId_idx`(`tenantId`),
  INDEX `HonorarioMedico_medicoId_idx`(`medicoId`),
  INDEX `HonorarioMedico_estado_idx`(`estado`),
  INDEX `HonorarioMedico_fechaGenerado_idx`(`fechaGenerado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TipoEgreso` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombre` VARCHAR(120) NOT NULL,
  `categoriaEstadoResultados` VARCHAR(50) NOT NULL DEFAULT 'GASTOS_OPERACION',
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `sistema` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TipoEgreso_tenantId_nombre_key`(`tenantId`, `nombre`),
  INDEX `TipoEgreso_tenantId_idx`(`tenantId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EquipoInstrumento` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `cantidad` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `costoTotal` DECIMAL(10,2) NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EquipoInstrumento_tenantId_nombre_key`(`tenantId`, `nombre`),
  INDEX `EquipoInstrumento_tenantId_idx`(`tenantId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DescripcionEgreso` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `tipoEgresoId` VARCHAR(36) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `productoId` VARCHAR(36) NULL,
  `servicioId` VARCHAR(36) NULL,
  `equipoId` VARCHAR(36) NULL,
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `sistema` BIT(1) NOT NULL DEFAULT b'0',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `DescripcionEgreso_tenantId_tipoEgresoId_nombre_key`(`tenantId`, `tipoEgresoId`, `nombre`),
  INDEX `DescripcionEgreso_tenantId_idx`(`tenantId`),
  INDEX `DescripcionEgreso_tipoEgresoId_idx`(`tipoEgresoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Egreso` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NULL,
  `tipoEgresoId` VARCHAR(36) NOT NULL,
  `descripcionEgresoId` VARCHAR(36) NULL,
  `descripcionManual` VARCHAR(150) NULL,
  `cantidad` DECIMAL(10,2) NOT NULL DEFAULT 1,
  `metodoPago` ENUM('EFECTIVO','TARJETA','TRANSFERENCIA','SEGURO','OTRO') NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `comentario` VARCHAR(255) NULL,
  `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `productoId` VARCHAR(36) NULL,
  `servicioId` VARCHAR(36) NULL,
  `equipoId` VARCHAR(36) NULL,
  `esAutomatico` BIT(1) NOT NULL DEFAULT b'0',
  `referenciaTipo` VARCHAR(40) NULL,
  `referenciaId` VARCHAR(36) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Egreso_tenantId_idx`(`tenantId`),
  INDEX `Egreso_fecha_idx`(`fecha`),
  INDEX `Egreso_tipoEgresoId_idx`(`tipoEgresoId`),
  INDEX `Egreso_referenciaTipo_referenciaId_idx`(`referenciaTipo`, `referenciaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TipoIngreso` ADD CONSTRAINT `TipoIngreso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_tipoIngresoId_fkey` FOREIGN KEY (`tipoIngresoId`) REFERENCES `TipoIngreso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_pagoId_fkey` FOREIGN KEY (`pagoId`) REFERENCES `Pago`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Ingreso` ADD CONSTRAINT `Ingreso_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `Ingreso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `HonorarioMedico` ADD CONSTRAINT `HonorarioMedico_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `TipoEgreso` ADD CONSTRAINT `TipoEgreso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `EquipoInstrumento` ADD CONSTRAINT `EquipoInstrumento_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DescripcionEgreso` ADD CONSTRAINT `DescripcionEgreso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DescripcionEgreso` ADD CONSTRAINT `DescripcionEgreso_tipoEgresoId_fkey` FOREIGN KEY (`tipoEgresoId`) REFERENCES `TipoEgreso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DescripcionEgreso` ADD CONSTRAINT `DescripcionEgreso_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `DescripcionEgreso` ADD CONSTRAINT `DescripcionEgreso_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `DescripcionEgreso` ADD CONSTRAINT `DescripcionEgreso_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `EquipoInstrumento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_tipoEgresoId_fkey` FOREIGN KEY (`tipoEgresoId`) REFERENCES `TipoEgreso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_descripcionEgresoId_fkey` FOREIGN KEY (`descripcionEgresoId`) REFERENCES `DescripcionEgreso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Egreso` ADD CONSTRAINT `Egreso_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `EquipoInstrumento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
