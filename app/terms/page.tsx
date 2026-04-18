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

          <Section title="2. Naturaleza de los aportes">
            <p>
              Los aportes realizados por los participantes <strong>no constituyen una
              captación, inversión o depósito de dinero</strong>. Los fondos no se utilizan
              con ningún fin durante el transcurso del concurso: son recolectados
              exclusivamente para conformar el pozo que se redistribuye entre los ganadores
              al final del torneo, de acuerdo con las reglas publicadas en la sección
              Reglas de la plataforma. En consecuencia, los participantes aceptan eximir
              a la plataforma, a sus organizadores y a everyweekfantasy.com (operado por
              Fantasía Semanal S.A.P.I. de C.V.) de cualquier interpretación de captación
              masiva de dinero o actividad financiera regulada.
            </p>
          </Section>

          <Section title="3. Exención de responsabilidad">
            <p>
              Los organizadores de la quiniela y everyweekfantasy.com (Fantasía Semanal
              S.A.P.I. de C.V.) <strong>se eximen de cualquier responsabilidad</strong> por
              el uso indebido del sitio, por decisiones tomadas por terceros con base en la
              información publicada, por interrupciones del servicio, o por cualquier daño
              directo o indirecto que pueda derivarse del uso de la plataforma.
            </p>
          </Section>

          <Section title="4. Responsabilidad del usuario">
            <p>
              El usuario es el único responsable del uso que haga de la plataforma. En
              particular, <strong>cualquier uso indebido</strong> —incluyendo la
              presentación de comprobantes de pago falsos, el uso de cuentas ajenas, el
              intento de manipular puntajes, o cualquier conducta que afecte la integridad
              del concurso— recaerá <strong>exclusivamente sobre quien lo realice</strong>,
              sin responsabilidad para los organizadores ni para everyweekfantasy.com.
            </p>
          </Section>

          <Section title="5. Tratamiento de datos personales">
            <p>
              Al registrarte, autorizas a <strong>everyweekfantasy.com (Fantasía Semanal
              S.A.P.I. de C.V.)</strong> a recolectar, almacenar y usar la información que
              suministras (nombre, correo corporativo, comprobante de pago y predicciones)
              con el único fin de operar la quiniela. El tratamiento se realiza cumpliendo
              con la normatividad legal vigente en Colombia (Ley 1581 de 2012 y decretos
              reglamentarios) y en México (Ley Federal de Protección de Datos Personales
              en Posesión de los Particulares). Puedes solicitar la consulta, corrección o
              eliminación de tus datos en cualquier momento escribiendo al correo del
              administrador.
            </p>
          </Section>

          <Section title="6. Aceptación">
            <p>
              La creación de una cuenta en Quiniela Habi implica la aceptación íntegra de
              estos términos y condiciones, así como de las{' '}
              <Link href="/rules" className="text-green-700 hover:underline font-medium">
                reglas del concurso
              </Link>
              . Si no estás de acuerdo con alguno de los puntos anteriores, te pedimos no
              registrarte ni utilizar la plataforma.
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
