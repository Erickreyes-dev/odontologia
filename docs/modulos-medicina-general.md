# Módulos nuevos para medicina general (MVP + base de crecimiento)

Este documento describe los módulos añadidos a nivel de **modelo de datos** para extender el sistema desde odontología hacia medicina general, manteniendo un núcleo compartido.

## Núcleo compartido reutilizado
Se mantiene sin romper el modelo existente:
- Pacientes, médicos, citas, consulta, cobro y pagos.
- Planes y seguimientos.

## Módulos nuevos implementados

### 1) Historia clínica estructurada
- `HistoriaClinica` (1:1 con paciente)
- Campos de antecedentes, HPI y lista de problemas activos.

### 2) Alergias del paciente
- `AlergiaPaciente`
- Incluye alérgeno, reacción, severidad y estado activo.

### 3) Signos vitales + examen físico
- `SignoVital` (N:1 con consulta)
- TA, FC, FR, temperatura, SatO2, peso, talla, IMC, glicemia y examen físico libre.
- Bandera `alertaCritica` para reglas clínicas futuras.

### 4) Diagnóstico codificado (CIE-10)
- `Cie10Catalogo` (catálogo base)
- `DiagnosticoConsulta` (principal/secundario, estado y fechas)
- Enum `EstadoDiagnostico`: sospecha, confirmado, descartado.

### 5) Prescripción estructurada
- `MedicamentoCatalogo`
- `Prescripcion` (encabezado de receta)
- `PrescripcionItem` (dosis, vía, frecuencia, duración, indicación)

### 6) Órdenes y resultados de estudios
- `OrdenEstudio` (laboratorio, imagen u otro)
- `ResultadoEstudio` (valor textual/numérico, unidad, rango, archivo e interpretación)

### 7) Interconsultas
- `Interconsulta` (referencia, urgencia, documento y contrarreferencia)

### 8) Programas de crónicos
- `ProgramaCronicoPaciente`
- Enum `TipoProgramaCronico`: HTA, DM2, dislipidemia, obesidad, asma/EPOC, otro.

## Enums nuevos
- `SeveridadAlergia`
- `EstadoDiagnostico`
- `TipoOrdenEstudio`
- `EstadoOrdenEstudio`
- `TipoProgramaCronico`

## Migración
Se agregó una migración SQL con la creación de tablas, índices y llaves foráneas:
- `prisma/migrations/20260406160000_general_medicine_modules/migration.sql`

## Próximos pasos sugeridos (UI)
1. Crear pestañas en la pantalla de consulta: historia, signos vitales, diagnósticos, prescripción, estudios y plan.
2. Agregar línea de tiempo clínica en ficha de paciente.
3. Activar validaciones clínicas (alergias, duplicidad, dosis máximas) en prescripción.
4. Incluir impresión/PDF de receta e integración de resultados adjuntos.
