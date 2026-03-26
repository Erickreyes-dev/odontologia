-- AlterTable
ALTER TABLE `Producto`
  ADD COLUMN `tipo` ENUM('CONSUMIBLE', 'VENTA') NOT NULL DEFAULT 'CONSUMIBLE',
  ADD COLUMN `precioVenta` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `ConsultaProducto`
  ADD COLUMN `precioUnitarioAplicado` DECIMAL(10, 2) NOT NULL DEFAULT 0;
