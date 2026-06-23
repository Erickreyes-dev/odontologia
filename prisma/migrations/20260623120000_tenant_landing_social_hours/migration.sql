-- AlterTable
ALTER TABLE `Tenant`
  ADD COLUMN `horariosJson` LONGTEXT NULL,
  ADD COLUMN `facebookUrl` VARCHAR(255) NULL,
  ADD COLUMN `twitterUrl` VARCHAR(255) NULL,
  ADD COLUMN `instagramUrl` VARCHAR(255) NULL;
