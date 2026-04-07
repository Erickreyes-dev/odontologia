ALTER TABLE `TenantWhatsappConfig`
  ADD COLUMN `verificationCode` VARCHAR(10) NULL,
  ADD COLUMN `verifiedAt` DATETIME(3) NULL;
