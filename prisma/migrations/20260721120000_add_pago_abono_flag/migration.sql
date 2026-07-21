ALTER TABLE `Pago`
  ADD COLUMN `esAbono` BIT(1) NOT NULL DEFAULT b'0';

CREATE INDEX `Pago_esAbono_idx` ON `Pago`(`esAbono`);
