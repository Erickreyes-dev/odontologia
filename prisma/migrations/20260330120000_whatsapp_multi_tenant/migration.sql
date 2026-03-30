-- AlterTable
ALTER TABLE `Paciente`
  MODIFY `telefono` VARCHAR(30) NULL,
  ADD COLUMN `codigoPostal` VARCHAR(20) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `WhatsAppConnection` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `provider` VARCHAR(20) NOT NULL DEFAULT 'meta',
  `businessId` VARCHAR(80) NOT NULL,
  `wabaId` VARCHAR(80) NOT NULL,
  `phoneNumberId` VARCHAR(80) NOT NULL,
  `displayPhoneNumber` VARCHAR(40) NULL,
  `verifiedName` VARCHAR(120) NULL,
  `accessTokenEncrypted` LONGTEXT NOT NULL,
  `tokenExpiresAt` DATETIME(3) NULL,
  `status` ENUM('pending', 'connected', 'error', 'disconnected') NOT NULL DEFAULT 'pending',
  `billingOwner` ENUM('tenant_meta_direct') NOT NULL DEFAULT 'tenant_meta_direct',
  `lastSyncAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `WhatsAppConnection_tenantId_phoneNumberId_key`(`tenantId`, `phoneNumberId`),
  INDEX `WhatsAppConnection_tenantId_status_idx`(`tenantId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatConversation` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `pacienteId` VARCHAR(36) NOT NULL,
  `connectionId` VARCHAR(36) NOT NULL,
  `waChatId` VARCHAR(120) NULL,
  `estado` ENUM('open', 'closed', 'archived') NOT NULL DEFAULT 'open',
  `lastMessageAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ChatConversation_tenantId_pacienteId_connectionId_key`(`tenantId`, `pacienteId`, `connectionId`),
  INDEX `ChatConversation_tenantId_estado_lastMessageAt_idx`(`tenantId`, `estado`, `lastMessageAt`),
  INDEX `ChatConversation_tenantId_waChatId_idx`(`tenantId`, `waChatId`),
  INDEX `ChatConversation_connectionId_idx`(`connectionId`),
  INDEX `ChatConversation_pacienteId_idx`(`pacienteId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `conversationId` VARCHAR(36) NOT NULL,
  `direction` ENUM('outbound', 'inbound', 'system') NOT NULL,
  `type` ENUM('text', 'template', 'image', 'document', 'audio', 'video', 'location', 'contact') NOT NULL,
  `body` LONGTEXT NULL,
  `mediaUrl` VARCHAR(1000) NULL,
  `mediaMimeType` VARCHAR(120) NULL,
  `mediaFileName` VARCHAR(255) NULL,
  `providerMessageId` VARCHAR(120) NULL,
  `providerStatus` ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received') NOT NULL DEFAULT 'queued',
  `errorCode` VARCHAR(80) NULL,
  `errorMessage` VARCHAR(500) NULL,
  `sentByUserId` VARCHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `ChatMessage_tenantId_providerMessageId_key`(`tenantId`, `providerMessageId`),
  INDEX `ChatMessage_tenantId_conversationId_createdAt_idx`(`tenantId`, `conversationId`, `createdAt`),
  INDEX `ChatMessage_tenantId_providerStatus_idx`(`tenantId`, `providerStatus`),
  INDEX `ChatMessage_conversationId_idx`(`conversationId`),
  INDEX `ChatMessage_providerMessageId_idx`(`providerMessageId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppWebhookEvent` (
  `id` VARCHAR(36) NOT NULL,
  `tenantId` VARCHAR(36) NOT NULL,
  `connectionId` VARCHAR(36) NOT NULL,
  `providerEventId` VARCHAR(120) NOT NULL,
  `payloadJson` LONGTEXT NOT NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `WhatsAppWebhookEvent_tenantId_providerEventId_key`(`tenantId`, `providerEventId`),
  INDEX `WhatsAppWebhookEvent_tenantId_processedAt_idx`(`tenantId`, `processedAt`),
  INDEX `WhatsAppWebhookEvent_connectionId_idx`(`connectionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhatsAppConnection`
  ADD CONSTRAINT `WhatsAppConnection_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatConversation`
  ADD CONSTRAINT `ChatConversation_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ChatConversation_pacienteId_fkey`
  FOREIGN KEY (`pacienteId`) REFERENCES `Paciente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ChatConversation_connectionId_fkey`
  FOREIGN KEY (`connectionId`) REFERENCES `WhatsAppConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage`
  ADD CONSTRAINT `ChatMessage_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ChatMessage_conversationId_fkey`
  FOREIGN KEY (`conversationId`) REFERENCES `ChatConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ChatMessage_sentByUserId_fkey`
  FOREIGN KEY (`sentByUserId`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppWebhookEvent`
  ADD CONSTRAINT `WhatsAppWebhookEvent_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `WhatsAppWebhookEvent_connectionId_fkey`
  FOREIGN KEY (`connectionId`) REFERENCES `WhatsAppConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
