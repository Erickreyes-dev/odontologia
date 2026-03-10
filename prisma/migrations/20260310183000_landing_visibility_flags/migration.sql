ALTER TABLE `Servicios`
  ADD COLUMN `mostrarEnLanding` BIT(1) NOT NULL DEFAULT b'0';

ALTER TABLE `Promocion`
  ADD COLUMN `mostrarEnLanding` BIT(1) NOT NULL DEFAULT b'0';
