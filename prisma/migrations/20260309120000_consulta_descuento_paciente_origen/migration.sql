-- AlterTable
ALTER TABLE `Consulta`
  ADD COLUMN `descuento` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `Paciente`
  ADD COLUMN `conocioClinica` ENUM('REDES_SOCIALES', 'AMIGOS', 'MEDIO_COMUNICACION', 'OTROS') NULL;
