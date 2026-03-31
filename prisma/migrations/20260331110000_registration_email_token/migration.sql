CREATE TABLE `RegistrationEmailToken` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `token` VARCHAR(128) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `verifiedAt` DATETIME(3) NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `RegistrationEmailToken_token_key`(`token`),
  INDEX `IX_RegistrationEmailToken_email`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
