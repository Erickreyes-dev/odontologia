-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,
    `contactoNombre` VARCHAR(120) NULL,
    `contactoCorreo` VARCHAR(150) NULL,
    `activo` BIT(1) NOT NULL DEFAULT true,
    `plan` VARCHAR(30) NOT NULL DEFAULT 'starter',
    `maxUsuarios` INTEGER NOT NULL DEFAULT 20,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permiso` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL,

    INDEX `Permiso_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Permiso_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolPermiso` (
    `id` VARCHAR(191) NOT NULL,
    `rolId` VARCHAR(191) NOT NULL,
    `permisoId` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolPermiso_permisoId_fkey`(`permisoId`),
    UNIQUE INDEX `RolPermiso_rolId_permisoId_key`(`rolId`, `permisoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `activo` BOOLEAN NOT NULL,

    INDEX `Rol_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Rol_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empleados` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `puesto_id` VARCHAR(36) NOT NULL,
    `identidad` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `correo` LONGTEXT NOT NULL,
    `FechaNacimiento` DATETIME(6) NULL,
    `fechaIngreso` DATETIME(6) NULL,
    `telefono` VARCHAR(20) NULL,
    `Vacaciones` INTEGER NOT NULL,
    `genero` VARCHAR(20) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Empleados_tenantId_idx`(`tenantId`),
    INDEX `Empleados_puesto_id_idx`(`puesto_id`),
    UNIQUE INDEX `Empleados_tenantId_identidad_key`(`tenantId`, `identidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Puesto` (
    `Id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `Nombre` VARCHAR(100) NOT NULL,
    `Descripcion` VARCHAR(100) NOT NULL,
    `Activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Puesto_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Puesto_tenantId_Nombre_key`(`tenantId`, `Nombre`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `empleado_id` VARCHAR(36) NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `contrasena` LONGTEXT NOT NULL,
    `DebeCambiarPassword` BOOLEAN NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `rol_id` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,

    UNIQUE INDEX `IX_Usuarios_empleado_id`(`empleado_id`),
    INDEX `Usuarios_tenantId_idx`(`tenantId`),
    INDEX `IX_Usuarios_rol_id`(`rol_id`),
    UNIQUE INDEX `Usuarios_tenantId_usuario_key`(`tenantId`, `usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `token` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_token_key`(`token`),
    INDEX `IX_PasswordResetToken_userId`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seguro` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Seguro_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Seguro_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paciente` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `identidad` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `fechaNacimiento` DATETIME(6) NULL,
    `genero` VARCHAR(20) NULL,
    `telefono` VARCHAR(20) NULL,
    `correo` VARCHAR(150) NULL,
    `direccion` VARCHAR(255) NULL,
    `seguroId` VARCHAR(36) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Paciente_tenantId_idx`(`tenantId`),
    INDEX `Paciente_seguroId_idx`(`seguroId`),
    UNIQUE INDEX `Paciente_tenantId_identidad_key`(`tenantId`, `identidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profesion` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Profesion_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Profesion_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servicios` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precioBase` DECIMAL(10, 2) NOT NULL,
    `duracionMin` INTEGER NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Servicios_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Servicios_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicos` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `idEmpleado` VARCHAR(36) NOT NULL,
    `profesionId` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Medicos_idEmpleado_key`(`idEmpleado`),
    INDEX `Medicos_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
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

-- CreateTable
CREATE TABLE `Consultorio` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `ubicacion` VARCHAR(150) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Consultorio_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Consultorio_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cita` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `medicoId` VARCHAR(36) NOT NULL,
    `consultorioId` VARCHAR(36) NOT NULL,
    `fechaHora` DATETIME(6) NOT NULL,
    `estado` VARCHAR(20) NOT NULL,
    `motivo` VARCHAR(255) NULL,
    `observacion` VARCHAR(255) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Cita_tenantId_idx`(`tenantId`),
    INDEX `Cita_pacienteId_idx`(`pacienteId`),
    INDEX `Cita_medicoId_idx`(`medicoId`),
    INDEX `Cita_consultorioId_idx`(`consultorioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consulta` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `citaId` VARCHAR(36) NOT NULL,
    `fechaConsulta` DATETIME(6) NULL,
    `diagnostico` VARCHAR(255) NULL,
    `notas` TEXT NULL,
    `observacionesClinicas` TEXT NULL,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `seguimientoId` VARCHAR(36) NULL,
    `financiamientoId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Consulta_citaId_key`(`citaId`),
    INDEX `Consulta_tenantId_idx`(`tenantId`),
    INDEX `Consulta_seguimientoId_idx`(`seguimientoId`),
    INDEX `Consulta_financiamientoId_idx`(`financiamientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultaServicio` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `consultaId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `precioAplicado` DECIMAL(10, 2) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultaServicio_tenantId_idx`(`tenantId`),
    INDEX `ConsultaServicio_consultaId_idx`(`consultaId`),
    INDEX `ConsultaServicio_servicioId_idx`(`servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `unidad` VARCHAR(50) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 0,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Producto_tenantId_idx`(`tenantId`),
    INDEX `Producto_nombre_idx`(`nombre`),
    UNIQUE INDEX `Producto_tenantId_nombre_key`(`tenantId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultaProducto` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `consultaId` VARCHAR(36) NOT NULL,
    `productoId` VARCHAR(36) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConsultaProducto_tenantId_idx`(`tenantId`),
    INDEX `ConsultaProducto_consultaId_idx`(`consultaId`),
    INDEX `ConsultaProducto_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cotizacion` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(20) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `observacion` VARCHAR(255) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Cotizacion_tenantId_idx`(`tenantId`),
    INDEX `Cotizacion_pacienteId_idx`(`pacienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CotizacionServicio` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `cotizacionId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `observacion` VARCHAR(255) NULL,

    INDEX `CotizacionServicio_tenantId_idx`(`tenantId`),
    INDEX `CotizacionServicio_servicioId_idx`(`servicioId`),
    UNIQUE INDEX `CotizacionServicio_cotizacionId_servicioId_key`(`cotizacionId`, `servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanTratamiento` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` ENUM('ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'ACTIVO',
    `fechaInicio` DATETIME(6) NOT NULL,
    `fechaFin` DATETIME(6) NULL,
    `medicoResponsableId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `PlanTratamiento_tenantId_idx`(`tenantId`),
    INDEX `PlanTratamiento_pacienteId_idx`(`pacienteId`),
    INDEX `PlanTratamiento_medicoResponsableId_idx`(`medicoResponsableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanEtapa` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `planId` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `orden` INTEGER NOT NULL DEFAULT 1,
    `intervaloDias` INTEGER NULL,
    `repeticiones` INTEGER NULL,
    `programarCita` BIT(1) NOT NULL DEFAULT true,
    `responsableMedicoId` VARCHAR(36) NULL,
    `crearDesdeConsultaId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `PlanEtapa_tenantId_idx`(`tenantId`),
    INDEX `PlanEtapa_planId_idx`(`planId`),
    INDEX `PlanEtapa_responsableMedicoId_idx`(`responsableMedicoId`),
    INDEX `PlanEtapa_crearDesdeConsultaId_idx`(`crearDesdeConsultaId`),
    UNIQUE INDEX `PlanEtapa_planId_orden_key`(`planId`, `orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanEtapaServicio` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `etapaId` VARCHAR(36) NOT NULL,
    `servicioId` VARCHAR(36) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioAplicado` DECIMAL(10, 2) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlanEtapaServicio_tenantId_idx`(`tenantId`),
    INDEX `PlanEtapaServicio_etapaId_idx`(`etapaId`),
    INDEX `PlanEtapaServicio_servicioId_idx`(`servicioId`),
    UNIQUE INDEX `PlanEtapaServicio_etapaId_servicioId_key`(`etapaId`, `servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seguimiento` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `etapaId` VARCHAR(36) NOT NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `fechaProgramada` DATETIME(6) NOT NULL,
    `fechaRealizada` DATETIME(6) NULL,
    `estado` ENUM('PENDIENTE', 'REALIZADO') NOT NULL DEFAULT 'PENDIENTE',
    `nota` VARCHAR(255) NULL,
    `citaId` VARCHAR(36) NULL,
    `creadoPorId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Seguimiento_tenantId_idx`(`tenantId`),
    INDEX `Seguimiento_etapaId_idx`(`etapaId`),
    INDEX `Seguimiento_pacienteId_idx`(`pacienteId`),
    INDEX `Seguimiento_citaId_idx`(`citaId`),
    INDEX `Seguimiento_fechaProgramada_idx`(`fechaProgramada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pago` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `ordenCobroId` VARCHAR(36) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodo` ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'SEGURO', 'OTRO') NOT NULL,
    `referencia` VARCHAR(100) NULL,
    `fechaPago` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `estado` ENUM('REGISTRADO', 'APLICADO', 'REVERTIDO') NOT NULL DEFAULT 'REGISTRADO',
    `comentario` VARCHAR(255) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Pago_ordenCobroId_key`(`ordenCobroId`),
    INDEX `Pago_tenantId_idx`(`tenantId`),
    INDEX `Pago_ordenCobroId_idx`(`ordenCobroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Financiamiento` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `pacienteId` VARCHAR(36) NOT NULL,
    `cotizacionId` VARCHAR(36) NULL,
    `planTratamientoId` VARCHAR(36) NULL,
    `montoTotal` DECIMAL(10, 2) NOT NULL,
    `anticipo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `saldo` DECIMAL(10, 2) NOT NULL,
    `cuotas` INTEGER NOT NULL,
    `interes` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `fechaInicio` DATETIME(6) NOT NULL,
    `fechaFin` DATETIME(6) NULL,
    `estado` ENUM('ACTIVO', 'PAGADO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'ACTIVO',
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Financiamiento_tenantId_idx`(`tenantId`),
    INDEX `Financiamiento_pacienteId_idx`(`pacienteId`),
    INDEX `Financiamiento_cotizacionId_idx`(`cotizacionId`),
    INDEX `Financiamiento_planTratamientoId_idx`(`planTratamientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrdenDeCobro` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
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

    INDEX `OrdenDeCobro_tenantId_idx`(`tenantId`),
    INDEX `OrdenDeCobro_pacienteId_idx`(`pacienteId`),
    INDEX `OrdenDeCobro_planTratamientoId_idx`(`planTratamientoId`),
    INDEX `OrdenDeCobro_financiamientoId_idx`(`financiamientoId`),
    INDEX `OrdenDeCobro_consultaId_idx`(`consultaId`),
    INDEX `OrdenDeCobro_seguimientoId_idx`(`seguimientoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuotaFinanciamiento` (
    `id` VARCHAR(36) NOT NULL,
    `tenantId` VARCHAR(36) NULL,
    `financiamientoId` VARCHAR(36) NOT NULL,
    `numero` INTEGER NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fechaVencimiento` DATETIME(6) NOT NULL,
    `pagada` BIT(1) NOT NULL DEFAULT false,
    `fechaPago` DATETIME(3) NULL,
    `pagoId` VARCHAR(36) NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `CuotaFinanciamiento_tenantId_idx`(`tenantId`),
    INDEX `CuotaFinanciamiento_financiamientoId_idx`(`financiamientoId`),
    INDEX `CuotaFinanciamiento_pagoId_idx`(`pagoId`),
    UNIQUE INDEX `CuotaFinanciamiento_financiamientoId_numero_key`(`financiamientoId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Permiso` ADD CONSTRAINT `Permiso_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolPermiso` ADD CONSTRAINT `RolPermiso_permisoId_fkey` FOREIGN KEY (`permisoId`) REFERENCES `Permiso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolPermiso` ADD CONSTRAINT `RolPermiso_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rol` ADD CONSTRAINT `Rol_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empleados` ADD CONSTRAINT `Empleados_puesto_id_fkey` FOREIGN KEY (`puesto_id`) REFERENCES `Puesto`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Puesto` ADD CONSTRAINT `Puesto_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `FK_Usuarios_Empleados_empleado_id` FOREIGN KEY (`empleado_id`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguro` ADD CONSTRAINT `Seguro_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_seguroId_fkey` FOREIGN KEY (`seguroId`) REFERENCES `Seguro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profesion` ADD CONSTRAINT `Profesion_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Servicios` ADD CONSTRAINT `Servicios_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos` ADD CONSTRAINT `Medicos_idEmpleado_fkey` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos` ADD CONSTRAINT `Medicos_profesionId_fkey` FOREIGN KEY (`profesionId`) REFERENCES `Profesion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos` ADD CONSTRAINT `Medicos_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos_Servicios` ADD CONSTRAINT `Medicos_Servicios_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medicos_Servicios` ADD CONSTRAINT `Medicos_Servicios_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultorio` ADD CONSTRAINT `Consultorio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_consultorioId_fkey` FOREIGN KEY (`consultorioId`) REFERENCES `Consultorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `Cita`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_seguimientoId_fkey` FOREIGN KEY (`seguimientoId`) REFERENCES `Seguimiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consulta` ADD CONSTRAINT `Consulta_financiamientoId_fkey` FOREIGN KEY (`financiamientoId`) REFERENCES `Financiamiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaServicio` ADD CONSTRAINT `ConsultaServicio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaServicio` ADD CONSTRAINT `ConsultaServicio_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaServicio` ADD CONSTRAINT `ConsultaServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaProducto` ADD CONSTRAINT `ConsultaProducto_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaProducto` ADD CONSTRAINT `ConsultaProducto_consultaId_fkey` FOREIGN KEY (`consultaId`) REFERENCES `Consulta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultaProducto` ADD CONSTRAINT `ConsultaProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cotizacion` ADD CONSTRAINT `Cotizacion_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CotizacionServicio` ADD CONSTRAINT `CotizacionServicio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CotizacionServicio` ADD CONSTRAINT `CotizacionServicio_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `Cotizacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CotizacionServicio` ADD CONSTRAINT `CotizacionServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanTratamiento` ADD CONSTRAINT `PlanTratamiento_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanTratamiento` ADD CONSTRAINT `PlanTratamiento_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanTratamiento` ADD CONSTRAINT `PlanTratamiento_medicoResponsableId_fkey` FOREIGN KEY (`medicoResponsableId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapa` ADD CONSTRAINT `PlanEtapa_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapa` ADD CONSTRAINT `PlanEtapa_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `PlanTratamiento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapa` ADD CONSTRAINT `PlanEtapa_responsableMedicoId_fkey` FOREIGN KEY (`responsableMedicoId`) REFERENCES `Medicos`(`idEmpleado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapa` ADD CONSTRAINT `PlanEtapa_crearDesdeConsultaId_fkey` FOREIGN KEY (`crearDesdeConsultaId`) REFERENCES `Consulta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapaServicio` ADD CONSTRAINT `PlanEtapaServicio_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapaServicio` ADD CONSTRAINT `PlanEtapaServicio_etapaId_fkey` FOREIGN KEY (`etapaId`) REFERENCES `PlanEtapa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanEtapaServicio` ADD CONSTRAINT `PlanEtapaServicio_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_etapaId_fkey` FOREIGN KEY (`etapaId`) REFERENCES `PlanEtapa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguimiento` ADD CONSTRAINT `Seguimiento_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `Cita`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_ordenCobroId_fkey` FOREIGN KEY (`ordenCobroId`) REFERENCES `OrdenDeCobro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financiamiento` ADD CONSTRAINT `Financiamiento_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financiamiento` ADD CONSTRAINT `Financiamiento_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financiamiento` ADD CONSTRAINT `Financiamiento_cotizacionId_fkey` FOREIGN KEY (`cotizacionId`) REFERENCES `Cotizacion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Financiamiento` ADD CONSTRAINT `Financiamiento_planTratamientoId_fkey` FOREIGN KEY (`planTratamientoId`) REFERENCES `PlanTratamiento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrdenDeCobro` ADD CONSTRAINT `OrdenDeCobro_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `CuotaFinanciamiento` ADD CONSTRAINT `CuotaFinanciamiento_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuotaFinanciamiento` ADD CONSTRAINT `CuotaFinanciamiento_financiamientoId_fkey` FOREIGN KEY (`financiamientoId`) REFERENCES `Financiamiento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuotaFinanciamiento` ADD CONSTRAINT `CuotaFinanciamiento_pagoId_fkey` FOREIGN KEY (`pagoId`) REFERENCES `Pago`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
