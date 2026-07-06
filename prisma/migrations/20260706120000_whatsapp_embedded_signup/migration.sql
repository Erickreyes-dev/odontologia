CREATE TABLE `WhatsappConnection` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `businessAccountId` VARCHAR(80) NOT NULL,
  `wabaId` VARCHAR(80) NOT NULL,
  `phoneNumberId` VARCHAR(80) NOT NULL,
  `displayPhone` VARCHAR(40) NULL,
  `verifiedName` VARCHAR(150) NULL,
  `qualityRating` VARCHAR(40) NULL,
  `messagingLimit` VARCHAR(80) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'connected',
  `rawSignupPayload` JSON NULL,
  `rawPhonePayload` JSON NULL,
  `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `disconnectedAt` DATETIME(3) NULL,
  `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updateAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `WhatsappConnection_tenantId_phoneNumberId_key`(`tenantId`, `phoneNumberId`),
  INDEX `WhatsappConnection_tenantId_status_idx`(`tenantId`, `status`),
  INDEX `WhatsappConnection_wabaId_idx`(`wabaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WhatsappConnection`
  ADD CONSTRAINT `WhatsappConnection_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
