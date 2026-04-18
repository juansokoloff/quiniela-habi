import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones · Quiniela Habi',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm text-green-100 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
            <p className="text-gray-500 text-sm mt-1">
              Quiniela Habi · Mundial 2026
            </p>
          </div>

          <Section title="1. Naturaleza de la plataforma">
            <p>
              Quiniela Habi <strong>no es un sitio de apuestas</strong>. Se trata de una
              iniciativa particular entre empleados de Habi y Tuhabi, cuyo único propósito
              es gestionar de forma ordenada una quiniela interna con ocasión del Mundial
              de Fútbol 2026. El organizador presta el servicio de administrar el concurso
              sin ánimo de lucro y no recibe contraprestación económica alguna por hacerlo.
            </p>
          </Section>

          <Section title="2. Elegibilidad y mayoría de edad">
            <p>
              Para participar en Quiniela Habi, el usuario debe:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Ser <strong>mayor de 18 años</strong> al momento del registro.
              </li>
              <li>
                Ser empleado activo o ex-empleado de Habi o Tuhabi y contar con un correo
                corporativo válido en los dominios <strong>@habi.co</strong> o{' '}
                <strong>@tuhabi.mx</strong> al momento del registro.
              </li>
              <li>
                Registrarse con su identidad real y suministrar información veraz.
              </li>
            </ul>
            <p>
              El registro con datos falsos, con el correo de un tercero, o por parte de un
              menor de edad, faculta a los organizadores a descalificar al participante
              sin derecho a reembolso.
            </p>
          </Section>

          <Section title="3. Naturaleza de los aportes y no reembolso">
            <p>
              Los aportes realizados por los participantes <strong>no constituyen una
              captación, inversión o depósito de dinero</strong>. Los fondos no se utilizan
              con ningún fin durante el transcurso del concurso: son recolectados
              exclusivamente para conformar el pozo que se redistribuye entre los ganadores
              al final del torneo, de acuerdo con las reglas publicadas en la sección
              Reglas de la plataforma. En consecuencia, los participantes aceptan eximir a
              la plataforma, a sus organizadores y a everyweekfantasy.com (operado por
              Fantasía Semanal S.A.P.I. de C.V.) de cualquier interpretación de captación
              masiva de dinero o actividad financiera regulada.
            </p>
            <p>
              Una vez <strong>iniciado el torneo</strong> (primer partido del Mundial 2026),
              el aporte del participante es <strong>no reembolsable</strong>, salvo en los
              supuestos de fuerza mayor descritos en la Sección 5. La decisión del
              participante de no continuar usando la plataforma no da derecho a devolución.
            </p>
          </Section>

          <Section title="4. Responsabilidad tributaria de los premios">
            <p>
              Cada ganador es <strong>el único responsable</strong> de declarar y pagar los
              impuestos, retenciones y demás obligaciones tributarias que correspondan
              sobre el premio recibido, conforme a la legislación vigente en su país de
              residencia. Ni los organizadores ni everyweekfantasy.com (Fantasía Semanal
              S.A.P.I. de C.V.) actúan como agentes retenedores ni asumen responsabilidad
              fiscal alguna sobre los premios entregados.
            </p>
          </Section>

          <Section title="5. Fuerza mayor y cancelación del torneo">
            <p>
              Si por causas de <strong>fuerza mayor o caso fortuito</strong> —incluyendo,
              sin limitarse a, cancelación o suspensión definitiva del Mundial 2026 por
              parte de FIFA, decisiones gubernamentales, conflictos armados, pandemias, u
              otros eventos ajenos a la voluntad de los organizadores— el concurso no
              pudiera llevarse a cabo ni completarse, el pozo acumulado será{' '}
              <strong>devuelto íntegramente a los participantes</strong>, en proporción a
              su aporte individual, dentro de un plazo razonable desde que se declare la
              imposibilidad de continuar.
            </p>
          </Section>

          <Section title="6. Interrupciones del servicio">
            <p>
              La plataforma se ofrece <strong>&quot;tal cual&quot;</strong>, sin garantía de
              disponibilidad ininterrumpida. Los organizadores harán esfuerzos razonables
              por mantener el sitio operativo, pero no serán responsables por fallas
              técnicas, caídas, errores de sincronización con proveedores externos, ni por
              predicciones que no pudieran registrarse o modificarse por dichas causas.
              En caso de incidentes que afecten la integridad del concurso, los
              organizadores podrán tomar las medidas razonables que consideren necesarias
              (reapertura de ventanas, anulación de puntajes, etc.), comunicándolo a los
              participantes.
            </p>
          </Section>

          <Section title="7. Exención de responsabilidad">
            <p>
              Los organizadores de la quiniela y everyweekfantasy.com (Fantasía Semanal
              S.A.P.I. de C.V.) <strong>se eximen de cualquier responsabilidad</strong> por
              el uso indebido del sitio, por decisiones tomadas por terceros con base en la
              información publicada, por interrupciones del servicio, o por cualquier daño
              directo o indirecto que pueda derivarse del uso de la plataforma.
            </p>
          </Section>

          <Section title="8. Responsabilidad del usuario">
            <p>
              El usuario es el único responsable del uso que haga de la plataforma. En
              particular, <strong>cualquier uso indebido</strong> —incluyendo la
              presentación de comprobantes de pago falsos, el uso de cuentas ajenas, el
              intento de manipular puntajes, o cualquier conducta que afecte la integridad
              del concurso— recaerá <strong>exclusivamente sobre quien lo realice</strong>,
              sin responsabilidad para los organizadores ni para everyweekfantasy.com.
            </p>
          </Section>

          <Section title="9. Comunicaciones operativas">
            <p>
              Al registrarte, aceptas recibir <strong>correos electrónicos operativos</strong>
              relacionados con la quiniela (confirmaciones, recordatorios, resultados,
              avisos de ganadores, cambios en las reglas o los términos). Estas
              comunicaciones no son de carácter comercial ni publicitario. Puedes
              solicitar dejar de recibirlas escribiendo al correo del administrador, en el
              entendido de que algunas comunicaciones son necesarias para operar el
              concurso.
            </p>
          </Section>

          <Section title="10. Propiedad intelectual">
            <p>
              La marca, el código fuente, el diseño, los logotipos y los contenidos de la
              plataforma son propiedad de <strong>Fantasía Semanal S.A.P.I. de C.V.
              (everyweekfantasy.com)</strong>. Se otorga al usuario una licencia limitada,
              personal e intransferible para acceder a la plataforma con el único fin de
              participar en la quiniela. Queda prohibida la reproducción, distribución o
              explotación del código o del contenido sin autorización previa por escrito.
            </p>
          </Section>

          <Section title="11. Tratamiento de datos personales y derechos ARCO">
            <p>
              Al registrarte, autorizas a <strong>everyweekfantasy.com (Fantasía Semanal
              S.A.P.I. de C.V.)</strong> a recolectar, almacenar y usar la información que
              suministras (nombre, correo corporativo, comprobante de pago y predicciones)
              con el único fin de operar la quiniela. El tratamiento se realiza cumpliendo
              con la normatividad legal vigente en Colombia (Ley 1581 de 2012 y decretos
              reglamentarios) y en México (Ley Federal de Protección de Datos Personales
              en Posesión de los Particulares).
            </p>
            <p>
              En cualquier momento puedes ejercer tus derechos de{' '}
              <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>,
              equivalentes a los derechos de consulta, actualización y supresión previstos
              en la regulación colombiana, escribiendo al correo del administrador
              indicado en la Sección 14. La respuesta se entregará dentro de los plazos
              previstos por la ley aplicable.
            </p>
          </Section>

          <Section title="12. Modificación de términos">
            <p>
              Los organizadores se reservan el derecho de <strong>modificar estos términos
              y condiciones o las reglas del concurso</strong> cuando exista una causa
              razonable (errores, ajustes legales, contingencias operativas). Los cambios
              serán notificados a los participantes por los canales habituales
              (plataforma y/o correo) y entrarán en vigor desde su publicación. La
              continuación en el uso de la plataforma después de una modificación implica
              la aceptación de la nueva versión.
            </p>
          </Section>

          <Section title="13. Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por las leyes de los <strong>Estados Unidos
              Mexicanos</strong>, jurisdicción donde se encuentra domiciliada Fantasía
              Semanal S.A.P.I. de C.V., operadora de everyweekfantasy.com. Cualquier
              controversia derivada de la interpretación, cumplimiento o ejecución de
              estos términos se someterá a los tribunales competentes de la Ciudad de
              México, renunciando expresamente las partes a cualquier otro fuero que
              pudiera corresponderles. Lo anterior sin perjuicio de los derechos
              irrenunciables que la legislación colombiana reconoce a los participantes
              residentes en Colombia.
            </p>
          </Section>

          <Section title="14. Aceptación y contacto">
            <p>
              La creación de una cuenta en Quiniela Habi implica la aceptación íntegra de
              estos términos y condiciones, así como de las{' '}
              <Link href="/rules" className="text-green-700 hover:underline font-medium">
                reglas del concurso
              </Link>
              . Si no estás de acuerdo con alguno de los puntos anteriores, te pedimos no
              registrarte ni utilizar la plataforma.
            </p>
            <p>
              Para consultas, solicitudes ARCO, reportes de uso indebido o cualquier otro
              asunto relacionado con la quiniela, puedes escribir a{' '}
              <a
                href="mailto:admin@example.com"
                className="text-green-700 hover:underline font-medium"
              >
                admin@example.com
              </a>
              .
            </p>
          </Section>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Última actualización: 18 de abril de 2026
            </p>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-xs text-green-200">
            Powered by{' '}
            <a
              href="https://everyweekfantasy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white font-medium"
            >
              everyweekfantasy.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
