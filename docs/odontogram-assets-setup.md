# Setup de assets SVG para odontograma (React-Odontogram-Modul)

Para usar los SVG del repositorio `ZoliQua/React-Odontogram-Modul` con esta implementación:

## 1) Descargar assets del repo origen

Descarga del repositorio origen la carpeta:

- `src/assets/teeth-svgs/`

> Si prefieres, también puedes copiar toda `src/assets/` y luego usar solo `teeth-svgs`.

## 2) Copiar en este proyecto

En este proyecto, crea y usa esta ruta:

- `public/assets/odontogram/teeth-svgs/`

Debes terminar con archivos así (ejemplos):

- `public/assets/odontogram/teeth-svgs/11.svg`
- `public/assets/odontogram/teeth-svgs/12.svg`
- `public/assets/odontogram/teeth-svgs/13.svg`
- ...
- `public/assets/odontogram/teeth-svgs/85.svg`

## 3) Convención de nombres requerida

La implementación busca archivos con nombre `{toothId}.svg`, por ejemplo:

- Pieza 16 -> `/assets/odontogram/teeth-svgs/16.svg`
- Pieza 74 -> `/assets/odontogram/teeth-svgs/74.svg`

Si tus archivos usan otro nombre, deberás renombrarlos o agregar un mapeo de IDs->archivo.

## 4) Dónde se usa en código

Archivo:

- `app/(protected)/citas/[id]/consulta/components/OdontogramaSelector.tsx`

Constante:

- `TOOTH_ASSET_BASE_PATH = "/assets/odontogram/teeth-svgs"`

Vista:

- Se muestra el SVG de la pieza seleccionada junto al editor por superficies.
