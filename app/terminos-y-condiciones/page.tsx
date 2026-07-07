import Link from "next/link";

const updatedAt = "6 de julio de 2026";

export default function TerminosYCondicionesPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12 text-slate-800">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Medisoft Core</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">Términos y condiciones</h1>
        <p className="text-slate-600">Última actualización: {updatedAt}</p>
        <p>
          Estos términos regulan el acceso y uso de Medisoft Core, una plataforma SaaS para gestión clínica, agenda,
          pacientes, pagos, comunicación y operaciones administrativas de clínicas y profesionales de salud.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">1. Aceptación del servicio</h2>
        <p>
          Al crear una cuenta, contratar un plan o utilizar la plataforma, el cliente confirma que tiene capacidad para
          actuar en nombre de su clínica o negocio y acepta cumplir estos términos, las políticas aplicables y la
          legislación vigente de su jurisdicción.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">2. Cuentas, tenants y responsabilidades</h2>
        <p>
          Cada tenant es responsable de la veracidad de su información, del uso de sus credenciales, de los permisos de
          sus usuarios internos y del cumplimiento de las normas sanitarias, tributarias, laborales y de protección de
          datos aplicables a sus operaciones.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">3. Integraciones con terceros y Meta</h2>
        <p>
          Cuando el tenant conecta WhatsApp Business, Facebook, Instagram u otros servicios de Meta, autoriza a Medisoft
          Core a recibir, almacenar y procesar identificadores técnicos como Business ID, WABA ID, Phone Number ID,
          estados de mensajes y eventos necesarios para operar la integración.
        </p>
        <p>
          El tenant conserva la responsabilidad de cumplir las Condiciones de Meta, las políticas de WhatsApp Business,
          obtener consentimientos válidos de sus pacientes y enviar comunicaciones permitidas por ley y por Meta.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">4. Datos clínicos y privacidad</h2>
        <p>
          La plataforma puede contener datos personales y clínicos ingresados por el tenant. Medisoft Core implementa
          controles razonables de seguridad, pero el tenant debe gestionar accesos mínimos necesarios, respaldos,
          autorizaciones de pacientes y solicitudes de derechos de privacidad según corresponda.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">5. Pagos, planes y suspensión</h2>
        <p>
          El acceso a funcionalidades puede depender del plan contratado, pagos al día, límites de usuarios y condiciones
          comerciales vigentes. Medisoft Core puede suspender o limitar el servicio ante impagos, abuso, riesgos de
          seguridad o uso contrario a estos términos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">6. Uso aceptable</h2>
        <p>
          Está prohibido utilizar la plataforma para actividades ilícitas, spam, suplantación, extracción no autorizada de
          datos, afectación de la disponibilidad del sistema o envío de contenido que infrinja derechos de terceros o
          políticas de proveedores integrados.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-950">7. Cambios y contacto</h2>
        <p>
          Medisoft Core puede actualizar estos términos para reflejar cambios legales, técnicos o comerciales. Las
          versiones actualizadas se publicarán en esta página. Para consultas operativas o legales, contacta al equipo
          administrador del sistema.
        </p>
        <p>
          También puedes volver al <Link className="font-medium text-emerald-700 underline" href="/">inicio</Link>.
        </p>
      </section>
    </main>
  );
}
