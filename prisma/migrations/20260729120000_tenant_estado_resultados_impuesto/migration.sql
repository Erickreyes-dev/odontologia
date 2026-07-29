ALTER TABLE `Tenant`
  ADD COLUMN `estadoResultadosImpuestoActivo` BIT(1) NOT NULL DEFAULT b'0',
  ADD COLUMN `estadoResultadosImpuestoNombre` VARCHAR(80) NOT NULL DEFAULT 'Impuesto ISV',
  ADD COLUMN `estadoResultadosImpuestoTasa` DECIMAL(5, 2) NOT NULL DEFAULT 15.00;
