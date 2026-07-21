-- Permite registrar un nuevo pago sobre una orden luego de revertir el pago anterior
-- y conservar el historial de pagos revertidos/abonos.
DROP INDEX `Pago_ordenCobroId_key` ON `Pago`;
