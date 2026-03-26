-- AlterTable
ALTER TABLE `TenantInvoice`
  ADD COLUMN `subtotal` DECIMAL(10,2) NULL,
  ADD COLUMN `impuesto` DECIMAL(10,2) NULL,
  ADD COLUMN `total` DECIMAL(10,2) NULL,
  ADD COLUMN `numeroFactura` VARCHAR(40) NULL,
  ADD COLUMN `facturarNombre` VARCHAR(150) NULL,
  ADD COLUMN `facturarCorreo` VARCHAR(150) NULL,
  ADD COLUMN `facturarTelefono` VARCHAR(30) NULL,
  ADD COLUMN `facturarTaxId` VARCHAR(40) NULL,
  ADD COLUMN `facturarDireccion` VARCHAR(255) NULL,
  ADD COLUMN `facturarCiudad` VARCHAR(80) NULL,
  ADD COLUMN `facturarPais` VARCHAR(80) NULL,
  ADD COLUMN `facturarPostal` VARCHAR(20) NULL,
  ADD COLUMN `descripcion` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Usuarios`
  ADD COLUMN `correo` VARCHAR(150) NULL;
