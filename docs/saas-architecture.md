# Arquitectura SaaS recomendada para Odontología

## Lo implementado en esta iteración

- **Modelo multi-tenant compartido** (shared DB + shared schema) con `tenantId` en entidades de negocio.
- Entidad central `Tenant` para representar cada clínica cliente.
- Autenticación actualizada para requerir `tenantSlug` y emitir sesión con contexto de tenant.
- Helpers reutilizables (`tenantWhere`, `withTenantData`) para evitar fugas de datos entre clínicas.
- Ejemplo aplicado en `pacientes/actions.ts` con aislamiento por tenant.

## Recomendaciones de arquitectura SaaS (siguiente fase)

1. **Aislamiento fuerte por capa**
   - Añadir middleware que resuelva tenant por subdominio (`clinic-a.tuapp.com`) o custom domain.
   - Pasar tenant context por request-scoped context (Server Actions / Route Handlers).

2. **Seguridad y cumplimiento**
   - Cifrar datos sensibles en reposo y tránsito.
   - Auditoría por tenant (`AuditLog`: quién, qué, cuándo, desde dónde).
   - Políticas de retención y borrado por tenant.

3. **Escalabilidad**
   - Cache por tenant (Redis key prefix por tenant).
   - Background jobs para recordatorios y procesos pesados.
   - Particionar tablas grandes por `tenantId` + fecha si el volumen crece.

4. **Operación SaaS**
   - Feature flags por plan (`starter`, `growth`, `enterprise`).
   - Cuotas y límites por tenant (usuarios, pacientes, storage, etc.).
   - Observabilidad con métricas por tenant (latencia, errores, consumo).

5. **Roadmap de datos**
   - Fase 1: shared schema (actual).
   - Fase 2: tenants premium en base dedicada (hybrid tenancy).
   - Fase 3: automatización de migración tenant-by-tenant.
