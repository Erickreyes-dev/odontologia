import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | Medisoft Core",
  description:
    "Política de Privacidad de Medisoft Core para el tratamiento de datos personales y clínicos dentro de la plataforma SaaS multi-tenant.",
};

const fechaVigencia = "30 de marzo de 2026";

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <article className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
          <header className="space-y-3 border-b pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">Medisoft Core</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Política de Privacidad</h1>
            <p className="text-sm text-muted-foreground">Fecha de vigencia: {fechaVigencia}</p>
            <p className="text-sm text-muted-foreground">
              Esta Política de Privacidad describe cómo Medisoft Core recopila, usa, almacena y protege los datos personales
              tratados en la plataforma <strong>www.medisoftcore.com</strong> y en sus subdominios por clínica (tenant).
            </p>
          </header>

          <section className="mt-8 space-y-6 text-sm leading-7 text-foreground/95">
            <div>
              <h2 className="text-lg font-semibold">1. Responsable y roles de tratamiento</h2>
              <p>
                Medisoft Core opera como proveedor tecnológico SaaS. Cada clínica usuaria actúa como responsable de los datos
                de sus pacientes y personal, y Medisoft Core actúa como encargado/procesador en la medida en que presta la
                infraestructura, módulos operativos y herramientas de comunicación.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">2. Datos que recopilamos</h2>
              <p>Según el uso de la plataforma, podemos tratar:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Datos de cuenta y autenticación: usuario, correo, credenciales cifradas, sesión y rol/permisos.</li>
                <li>Datos de clínica: nombre comercial, contacto, configuración operativa, plan y estado de suscripción.</li>
                <li>
                  Datos de pacientes: identidad, nombre, apellido, fecha de nacimiento, género, teléfono, código postal,
                  correo, dirección y trazabilidad clínica/administrativa.
                </li>
                <li>
                  Datos clínicos y administrativos: citas, consultas, recetas, constancias, planes de tratamiento,
                  cotizaciones, pagos, recibos, órdenes de cobro e inventario.
                </li>
                <li>
                  Datos de comunicación: notificaciones por correo y mensajería de WhatsApp Business (mensajes, estados,
                  eventos webhook y metadatos).
                </li>
                <li>Datos técnicos: IP, agente de usuario, registros operativos y eventos de seguridad.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">3. Finalidades del tratamiento</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Prestar el servicio SaaS contratado por la clínica.</li>
                <li>Gestionar operación clínica, agenda, historias, cobros y procesos internos autorizados.</li>
                <li>Habilitar comunicaciones con pacientes por canales configurados (Email, WhatsApp o ambos).</li>
                <li>Administrar acceso por roles y permisos y mantener seguridad de la cuenta.</li>
                <li>Cumplir obligaciones legales, regulatorias y contractuales aplicables.</li>
                <li>Detectar fraudes, abuso o incidentes de seguridad y responder ante ellos.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">4. Base legal</h2>
              <p>
                Tratamos datos con base en: (i) ejecución del contrato de servicio con la clínica; (ii) cumplimiento de
                obligaciones legales; (iii) interés legítimo en seguridad y continuidad operativa; y, cuando aplique,
                (iv) consentimiento informado gestionado por la clínica frente a sus pacientes.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">5. Multi-tenant y separación de información</h2>
              <p>
                Medisoft Core aplica controles de aislamiento por tenant para evitar mezcla de datos entre clínicas.
                Cada organización accede únicamente a su propio entorno lógico, según credenciales y permisos vigentes.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">6. WhatsApp Business (Meta Cloud API)</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Cada clínica conecta su propio activo de WhatsApp Business.</li>
                <li>
                  El costo de tráfico/mensajería es facturado directamente por Meta a la clínica (no por Medisoft Core).
                </li>
                <li>
                  Medisoft Core almacena metadatos y eventos necesarios para operación, trazabilidad, entrega y soporte.
                </li>
                <li>La clínica es responsable de la base legal de contacto y del contenido que envía a sus pacientes.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold">7. Compartición de datos</h2>
              <p>Podemos compartir datos únicamente cuando sea necesario con:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Proveedores de infraestructura, correo, pagos y mensajería (incluyendo Meta para WhatsApp).</li>
                <li>Encargados de tratamiento bajo obligaciones contractuales de confidencialidad y seguridad.</li>
                <li>Autoridades competentes cuando una ley o mandato lo requiera.</li>
              </ul>
              <p>No vendemos datos personales de pacientes o usuarios.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">8. Transferencias internacionales</h2>
              <p>
                Dependiendo de la infraestructura y de integraciones de terceros, ciertos datos pueden procesarse fuera del
                país de la clínica. Cuando ocurra, se aplicarán salvaguardas razonables, contractuales y técnicas para su
                protección.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">9. Seguridad de la información</h2>
              <p>
                Aplicamos medidas administrativas, técnicas y organizativas razonables: control de acceso por rol,
                segregación multi-tenant, registros operativos, prácticas de seguridad de credenciales y procedimientos de
                respuesta a incidentes.
              </p>
              <p>
                Ningún sistema es infalible al 100%; por ello mantenemos mejora continua y revisión periódica de controles.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">10. Conservación de datos</h2>
              <p>
                Conservamos los datos durante la vigencia del servicio y por el tiempo necesario para fines legales,
                contables, regulatorios, auditoría, resolución de disputas y prevención de fraude. Posteriormente,
                eliminamos o anonimizamos cuando sea procedente.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">11. Derechos de titulares</h2>
              <p>
                Los titulares pueden solicitar acceso, rectificación, actualización, supresión, limitación u oposición,
                según la normativa aplicable. Para datos de pacientes, la solicitud debe dirigirse primero a la clínica que
                recabó la información; Medisoft Core asistirá técnicamente cuando corresponda.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">12. Menores de edad y datos sensibles de salud</h2>
              <p>
                El tratamiento de datos de salud y de menores debe realizarse conforme a la legislación sanitaria y de
                protección de datos aplicable en cada jurisdicción. La clínica usuaria es responsable de obtener y mantener
                los consentimientos y autorizaciones necesarios.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">13. Cookies y tecnologías similares</h2>
              <p>
                Utilizamos cookies y almacenamiento local para autenticación de sesión, seguridad, preferencia de interfaz
                y operación técnica del sistema. Puedes gestionar cookies desde tu navegador, aunque algunas funciones
                pueden verse afectadas.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">14. Cambios a esta política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad para reflejar cambios legales, técnicos u operativos.
                Publicaremos la versión vigente en esta misma URL, indicando fecha de actualización.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">15. Contacto</h2>
              <p>
                Para consultas de privacidad y protección de datos escríbenos desde el formulario de contacto oficial del
                sitio o al canal corporativo que Medisoft Core publique para atención legal y de cumplimiento.
              </p>
            </div>
          </section>

          <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
            <p>
              Esta política forma parte integral de los términos de uso de Medisoft Core. Si no estás de acuerdo con su
              contenido, debes abstenerte de utilizar la plataforma.
            </p>
            <div className="mt-4">
              <Link href="/" className="font-medium text-cyan-700 hover:underline dark:text-cyan-300">
                Volver al inicio
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
}
