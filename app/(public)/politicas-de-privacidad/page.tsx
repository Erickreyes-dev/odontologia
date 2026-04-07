import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Section = { titulo: string; contenido: string };

type PolicyContent = {
  heading: string;
  updatedAt: string;
  legalNote: string;
  termsTitle: string;
  privacyTitle: string;
  terms: Section[];
  privacy: Section[];
};

const contentByLang: Record<"es" | "en", PolicyContent> = {
  es: {
    heading: "Políticas de Privacidad y Términos de Uso",
    updatedAt: "Última actualización: 6 de abril de 2026.",
    legalNote:
      "Este documento es un modelo integral para tu sistema. Se recomienda validarlo con un abogado en tu jurisdicción antes de su publicación final.",
    termsTitle: "Términos y Condiciones de Uso",
    privacyTitle: "Política de Privacidad",
    terms: [
      {
        titulo: "1. Aceptación de los términos",
        contenido:
          "Al acceder, registrarte o usar la plataforma, aceptas cumplir estos Términos y Condiciones de Uso y la presente Política de Privacidad. Si no estás de acuerdo, debes abstenerte de utilizar el sistema.",
      },
      {
        titulo: "2. Objeto del servicio",
        contenido:
          "El sistema ofrece herramientas de gestión clínica y administrativa para consultorios y clínicas odontológicas, incluyendo agenda, pacientes, historiales, pagos, inventario y funcionalidades relacionadas.",
      },
      {
        titulo: "3. Registro y cuentas",
        contenido:
          "Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta. Debes proporcionar información veraz, completa y actualizada al registrarte.",
      },
      {
        titulo: "4. Uso permitido",
        contenido:
          "Solo puedes usar la plataforma con fines legales y conforme a la normativa aplicable. Queda prohibido acceder sin autorización, vulnerar la seguridad, extraer datos de forma masiva o utilizar el sistema para actividades ilícitas.",
      },
      {
        titulo: "5. Licencia de uso",
        contenido:
          "Se otorga una licencia limitada, no exclusiva, revocable e intransferible para usar el sistema durante la vigencia de tu suscripción o relación contractual, exclusivamente para tu operación interna.",
      },
      {
        titulo: "6. Propiedad intelectual",
        contenido:
          "El software, diseños, interfaces, marcas, bases de datos y contenidos del sistema son propiedad del titular de la plataforma o de sus licenciantes. No se permite copiar, modificar, descompilar o redistribuir sin autorización previa por escrito.",
      },
      {
        titulo: "7. Pagos y facturación",
        contenido:
          "Los planes, precios, periodos, renovaciones, impuestos, facturación y reglas de cancelación se rigen por las condiciones comerciales vigentes al momento de la contratación. El impago puede ocasionar suspensión o terminación del servicio.",
      },
      {
        titulo: "8. Disponibilidad y soporte",
        contenido:
          "Se realizarán esfuerzos razonables para mantener la disponibilidad del servicio, pero no se garantiza operación ininterrumpida ni libre de errores. Puede haber mantenimientos programados o incidencias fuera del control del proveedor.",
      },
      {
        titulo: "9. Limitación de responsabilidad",
        contenido:
          "En la máxima medida permitida por la ley, el proveedor no será responsable por daños indirectos, incidentales, especiales o consecuenciales, lucro cesante, pérdida de datos o interrupción de negocio derivados del uso de la plataforma.",
      },
      {
        titulo: "10. Terminación",
        contenido:
          "El acceso al sistema podrá suspenderse o terminarse por incumplimiento de estos términos, por requerimientos legales o por finalización de la relación contractual, conforme al procedimiento aplicable.",
      },
      {
        titulo: "11. Cambios en los términos",
        contenido:
          "Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones serán publicadas en esta página y entrarán en vigor desde su publicación, salvo indicación distinta.",
      },
      {
        titulo: "12. Ley aplicable y jurisdicción",
        contenido:
          "Estos términos se interpretarán conforme a la legislación aplicable en la jurisdicción indicada en el contrato comercial principal. Cualquier controversia se someterá a los tribunales competentes de dicha jurisdicción, salvo pacto distinto.",
      },
    ],
    privacy: [
      {
        titulo: "1. Responsable del tratamiento",
        contenido:
          "El responsable del tratamiento de los datos personales es la entidad titular de esta plataforma. Para consultas de privacidad o ejercicio de derechos, puedes contactar al correo de soporte legal del servicio.",
      },
      {
        titulo: "2. Datos que recopilamos",
        contenido:
          "Podemos recopilar datos de identificación y contacto, datos de usuarios internos, información de pacientes ingresada por la clínica, datos de facturación, registros de actividad, direcciones IP, cookies técnicas y metadatos operativos.",
      },
      {
        titulo: "3. Finalidades del tratamiento",
        contenido:
          "Utilizamos los datos para prestar y mejorar el servicio, gestionar cuentas y suscripciones, habilitar módulos clínicos y administrativos, ofrecer soporte, cumplir obligaciones legales y prevenir fraudes o accesos no autorizados.",
      },
      {
        titulo: "4. Base legal",
        contenido:
          "Tratamos datos personales con fundamento en la ejecución contractual, el cumplimiento de obligaciones legales, el interés legítimo en seguridad y continuidad operativa, y cuando corresponda, el consentimiento del titular.",
      },
      {
        titulo: "5. Encargados y terceros",
        contenido:
          "Podemos compartir datos con proveedores tecnológicos, pasarelas de pago y servicios de infraestructura estrictamente necesarios para operar el sistema, bajo acuerdos de confidencialidad y medidas de protección adecuadas.",
      },
      {
        titulo: "6. Transferencias internacionales",
        contenido:
          "Cuando existan transferencias internacionales de datos, se implementarán salvaguardas adecuadas conforme a la normativa aplicable, como cláusulas contractuales o mecanismos equivalentes de protección.",
      },
      {
        titulo: "7. Conservación de datos",
        contenido:
          "Conservamos los datos durante la vigencia de la relación contractual y por los periodos adicionales exigidos por la ley o necesarios para la defensa de reclamaciones.",
      },
      {
        titulo: "8. Seguridad de la información",
        contenido:
          "Aplicamos medidas técnicas y organizativas razonables para proteger la información, incluyendo controles de acceso, segregación por roles, trazabilidad operativa y protocolos de respaldo.",
      },
      {
        titulo: "9. Derechos de los titulares",
        contenido:
          "Los titulares pueden ejercer sus derechos de acceso, rectificación, actualización, oposición, supresión o portabilidad según la legislación aplicable, a través de los canales de contacto habilitados.",
      },
      {
        titulo: "10. Cookies",
        contenido:
          "Utilizamos cookies y tecnologías similares para autenticación, preferencias de sesión, seguridad y analítica funcional del producto. Puedes configurar tu navegador para limitar ciertas cookies, con posibles impactos en funcionalidades.",
      },
      {
        titulo: "11. Datos sensibles y clínicos",
        contenido:
          "Cuando la clínica trate datos de salud o información sensible dentro de la plataforma, será responsable de contar con la base legal correspondiente, informar a los titulares y aplicar medidas reforzadas de confidencialidad.",
      },
      {
        titulo: "12. Cambios en esta política",
        contenido:
          "Podemos actualizar esta Política de Privacidad para reflejar cambios normativos, técnicos o del servicio. La versión vigente estará siempre disponible en esta página.",
      },
    ],
  },
  en: {
    heading: "Privacy Policy and Terms of Use",
    updatedAt: "Last updated: April 6, 2026.",
    legalNote:
      "This document is a comprehensive template for your system. It should be reviewed by a licensed attorney in your jurisdiction before final publication.",
    termsTitle: "Terms and Conditions of Use",
    privacyTitle: "Privacy Policy",
    terms: [
      {
        titulo: "1. Acceptance of terms",
        contenido:
          "By accessing, registering, or using the platform, you agree to comply with these Terms and Conditions of Use and this Privacy Policy. If you disagree, you must stop using the system.",
      },
      {
        titulo: "2. Service purpose",
        contenido:
          "The system provides clinical and administrative management tools for dental practices and clinics, including scheduling, patients, records, billing, inventory, and related functionality.",
      },
      {
        titulo: "3. Registration and accounts",
        contenido:
          "You are responsible for safeguarding your credentials and all activity under your account. You must provide accurate, complete, and up-to-date registration information.",
      },
      {
        titulo: "4. Permitted use",
        contenido:
          "You may use the platform only for lawful purposes and in compliance with applicable regulations. Unauthorized access, security circumvention, mass data extraction, or illegal activity is prohibited.",
      },
      {
        titulo: "5. License",
        contenido:
          "A limited, non-exclusive, revocable, non-transferable license is granted to use the system during your active subscription or contractual relationship, solely for internal operations.",
      },
      {
        titulo: "6. Intellectual property",
        contenido:
          "The software, interface design, trademarks, databases, and system content are owned by the platform owner or licensors. Copying, modifying, reverse engineering, or redistribution without prior written consent is not allowed.",
      },
      {
        titulo: "7. Payments and billing",
        contenido:
          "Plans, prices, billing cycles, renewals, taxes, invoicing, and cancellation rules are governed by the commercial terms in force at the time of contracting. Non-payment may lead to suspension or termination.",
      },
      {
        titulo: "8. Availability and support",
        contenido:
          "Reasonable efforts are made to keep the service available, but uninterrupted or error-free operation is not guaranteed. Scheduled maintenance or incidents beyond provider control may occur.",
      },
      {
        titulo: "9. Limitation of liability",
        contenido:
          "To the fullest extent permitted by law, the provider is not liable for indirect, incidental, special, or consequential damages, lost profits, data loss, or business interruption arising from platform use.",
      },
      {
        titulo: "10. Termination",
        contenido:
          "Access may be suspended or terminated for breach of these terms, legal requirements, or the end of the contractual relationship, under the applicable process.",
      },
      {
        titulo: "11. Changes to terms",
        contenido:
          "We reserve the right to modify these terms at any time. Updates will be posted on this page and become effective upon publication unless otherwise stated.",
      },
      {
        titulo: "12. Governing law and jurisdiction",
        contenido:
          "These terms are interpreted under the applicable law specified in the governing commercial agreement. Any dispute will be submitted to the competent courts of that jurisdiction unless otherwise agreed.",
      },
    ],
    privacy: [
      {
        titulo: "1. Data controller",
        contenido:
          "The data controller is the entity that owns this platform. For privacy questions or rights requests, contact the legal/privacy support channel provided by the service.",
      },
      {
        titulo: "2. Data we collect",
        contenido:
          "We may collect identification and contact data, internal user data, patient data entered by the clinic, billing information, activity logs, IP addresses, technical cookies, and operational metadata.",
      },
      {
        titulo: "3. Processing purposes",
        contenido:
          "We use personal data to deliver and improve the service, manage accounts and subscriptions, enable clinical and administrative modules, provide support, comply with legal duties, and prevent fraud or unauthorized access.",
      },
      {
        titulo: "4. Legal basis",
        contenido:
          "Personal data is processed under contractual necessity, legal obligations, legitimate interests in security and service continuity, and where required, data subject consent.",
      },
      {
        titulo: "5. Processors and third parties",
        contenido:
          "We may share data with technology vendors, payment gateways, and infrastructure providers strictly necessary to operate the system, under confidentiality commitments and appropriate safeguards.",
      },
      {
        titulo: "6. International transfers",
        contenido:
          "Where international transfers occur, appropriate safeguards are implemented according to applicable law, such as contractual clauses or equivalent legal mechanisms.",
      },
      {
        titulo: "7. Data retention",
        contenido:
          "Data is retained during the contractual relationship and for additional periods required by law or necessary to defend legal claims.",
      },
      {
        titulo: "8. Information security",
        contenido:
          "We apply reasonable technical and organizational safeguards, including access controls, role-based segregation, operational traceability, and backup protocols.",
      },
      {
        titulo: "9. Data subject rights",
        contenido:
          "Data subjects may exercise applicable rights such as access, rectification, update, objection, deletion, and portability through the designated contact channels.",
      },
      {
        titulo: "10. Cookies",
        contenido:
          "We use cookies and similar technologies for authentication, session preferences, security, and functional analytics. You can limit cookies in your browser, which may affect certain features.",
      },
      {
        titulo: "11. Sensitive and health data",
        contenido:
          "When clinics process health or other sensitive data in the platform, they are responsible for having the proper legal basis, providing notice to data subjects, and applying strengthened confidentiality safeguards.",
      },
      {
        titulo: "12. Policy updates",
        contenido:
          "We may update this Privacy Policy to reflect legal, technical, or service changes. The current version will always be available on this page.",
      },
    ],
  },
};

function PolicyBlock({ content }: { content: PolicyContent }) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{content.heading}</h2>
        <p className="text-sm text-muted-foreground">{content.updatedAt}</p>
        <p className="text-sm text-muted-foreground">{content.legalNote}</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">{content.termsTitle}</h3>
        <div className="space-y-5">
          {content.terms.map((item) => (
            <article key={item.titulo} className="space-y-2 rounded-lg border border-border/60 p-4">
              <h4 className="text-base font-semibold">{item.titulo}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.contenido}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">{content.privacyTitle}</h3>
        <div className="space-y-5">
          {content.privacy.map((item) => (
            <article key={item.titulo} className="space-y-2 rounded-lg border border-border/60 p-4">
              <h4 className="text-base font-semibold">{item.titulo}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.contenido}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default function PoliticasPrivacidadPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-bold tracking-tight">Políticas de Privacidad y Terms of Use</CardTitle>
          <p className="text-sm text-muted-foreground">
            Español e English en una sola página para compartir con pacientes, usuarios y personal administrativo.
          </p>
        </CardHeader>
        <CardContent className="space-y-12">
          <PolicyBlock content={contentByLang.es} />
          <PolicyBlock content={contentByLang.en} />
        </CardContent>
      </Card>
    </div>
  );
}
