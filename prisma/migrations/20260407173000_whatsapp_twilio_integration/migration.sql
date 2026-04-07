CREATE TABLE `TenantWhatsappConfig` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `provider` VARCHAR(30) NOT NULL DEFAULT 'twilio',
  `estado` VARCHAR(20) NOT NULL DEFAULT 'desconectado',
  `twilioAccountSid` VARCHAR(80) NULL,
  `twilioAuthToken` VARCHAR(100) NULL,
  `twilioWhatsappNumber` VARCHAR(30) NULL,
  `webhookSecret` VARCHAR(100) NULL,
  `mensajeAutoRespuesta` VARCHAR(500) NULL,
  `aceptaAgendamientoChat` BIT(1) NOT NULL DEFAULT b'1',
  `activo` BIT(1) NOT NULL DEFAULT b'1',
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `TenantWhatsappConfig_tenantId_key`(`tenantId`),
  INDEX `TenantWhatsappConfig_estado_idx`(`estado`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TenantWhatsappMensaje` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `configId` VARCHAR(36) NULL,
  `direccion` VARCHAR(10) NOT NULL,
  `mensajeSid` VARCHAR(80) NULL,
  `fromPhone` VARCHAR(30) NULL,
  `toPhone` VARCHAR(30) NULL,
  `cuerpo` VARCHAR(1600) NULL,
  `mediaCount` INTEGER NOT NULL DEFAULT 0,
  `mediaUrls` TEXT NULL,
  `estadoEntrega` VARCHAR(30) NULL,
  `tipoEvento` VARCHAR(30) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `TenantWhatsappMensaje_mensajeSid_key`(`mensajeSid`),
  INDEX `TenantWhatsappMensaje_tenantId_createAt_idx`(`tenantId`, `createAt`),
  INDEX `TenantWhatsappMensaje_configId_idx`(`configId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TenantWhatsappConfig`
  ADD CONSTRAINT `TenantWhatsappConfig_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TenantWhatsappMensaje`
  ADD CONSTRAINT `TenantWhatsappMensaje_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TenantWhatsappMensaje`
  ADD CONSTRAINT `TenantWhatsappMensaje_configId_fkey`
  FOREIGN KEY (`configId`) REFERENCES `TenantWhatsappConfig`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
