ALTER TABLE `Tenant`
  ADD COLUMN `whatsappUrl` VARCHAR(255) NULL;

ALTER TABLE `Servicios`
  ADD COLUMN `mostrarPrecio` BIT(1) NOT NULL DEFAULT b'1';
