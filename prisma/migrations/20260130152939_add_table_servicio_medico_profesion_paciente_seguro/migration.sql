-- CreateTable
CREATE TABLE `Seguro` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paciente` (
    `id` VARCHAR(36) NOT NULL,
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

    UNIQUE INDEX `Paciente_identidad_key`(`identidad`),
    INDEX `Paciente_seguroId_idx`(`seguroId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profesion` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profesion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medico` (
    `idEmpleado` VARCHAR(36) NOT NULL,
    `profesionId` VARCHAR(36) NOT NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Medico_profesionId_idx`(`profesionId`),
    PRIMARY KEY (`idEmpleado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servicio` (
    `id` VARCHAR(36) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `precioBase` DECIMAL(10, 2) NOT NULL,
    `duracionMin` INTEGER NOT NULL,
    `medicoId` VARCHAR(36) NULL,
    `activo` BIT(1) NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    INDEX `Servicio_medicoId_idx`(`medicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Paciente` ADD CONSTRAINT `Paciente_seguroId_fkey` FOREIGN KEY (`seguroId`) REFERENCES `Seguro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medico` ADD CONSTRAINT `Medico_idEmpleado_fkey` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medico` ADD CONSTRAINT `Medico_profesionId_fkey` FOREIGN KEY (`profesionId`) REFERENCES `Profesion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Servicio` ADD CONSTRAINT `Servicio_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `Medico`(`idEmpleado`) ON DELETE SET NULL ON UPDATE CASCADE;
