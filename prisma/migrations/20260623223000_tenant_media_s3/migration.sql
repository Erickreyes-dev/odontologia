ALTER TABLE `Tenant`
  ADD COLUMN `logoPath` VARCHAR(500) NULL,
  ADD COLUMN `landingImagePath` VARCHAR(500) NULL;

UPDATE `Tenant`
SET `logoPath` = `logoBase64`
WHERE `logoBase64` IS NOT NULL
  AND `logoBase64` NOT LIKE 'data:%'
  AND CHAR_LENGTH(`logoBase64`) <= 500;

ALTER TABLE `Tenant` DROP COLUMN `logoBase64`;
