import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RulesPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reglas de la Quiniela</h1>
        <p className="text-gray-500 text-sm mt-0.5">Quiniela Habi - Mundial 2026</p>
      </div>

      {/* Inscripcion */}
      <Section title="Inscripcion">
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>Para participar debes registrarte en la plataforma y subir un comprobante de pago.</li>
          <li>
            <strong>Colombia:</strong> Nequi a la llave BreB <code className="bg-gray-100 px-1 rounded">[REDACTED-NEQUI]</code> por <strong>$20,000 COP</strong>.
          </li>
          <li>
            <strong>Mexico:</strong> Transferencia a CLABE <code className="bg-gray-100 px-1 rounded">[REDACTED-CLABE]</code> por <strong>$100 MXN</strong>.
          </li>
          <li>El comprobante sera validado automaticamente. El administrador tambien puede aprobar pagos manualmente.</li>
        </ul>
      </Section>

      {/* Como predecir */}
      <Section title="Como hacer predicciones">
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>Una vez aprobado tu pago, podras ingresar tus predicciones para cada partido.</li>
          <li>Debes ingresar el marcador exacto que crees que tendra el partido (goles local y visitante).</li>
          <li>Puedes modificar tu prediccion hasta <strong>10 minutos antes</strong> del inicio del partido.</li>
          <li>Si no registras prediccion para un partido, obtendras <strong>0 puntos</strong> en ese partido.</li>
        </ul>
      </Section>

      {/* Sistema de puntos */}
      <Section title="Sistema de puntos">
        <p className="text-gray-600 text-sm mb-4">
          Cada prediccion se evalua en 4 criterios. Los puntos base aplican en fase de grupos.
          En fases eliminatorias (octavos, cuartos, semifinal y final) los puntos se <strong>duplican</strong>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="px-4 py-2.5 text-left font-semibold">Criterio</th>
                <th className="px-4 py-2.5 text-center font-semibold">Grupos</th>
                <th className="px-4 py-2.5 text-center font-semibold">Eliminatorias</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gray-700">Acertar ganador o empate</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">5 pts</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">10 pts</td>
              </tr>
              <tr className="border-t border-gray-100 bg-gray-50/50">
                <td className="px-4 py-2.5 text-gray-700">Acertar goles del equipo local</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">2 pts</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">4 pts</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2.5 text-gray-700">Acertar goles del equipo visitante</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">2 pts</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">4 pts</td>
              </tr>
              <tr className="border-t border-gray-100 bg-gray-50/50">
                <td className="px-4 py-2.5 text-gray-700">Acertar diferencia de goles</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">1 pt</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-700">2 pts</td>
              </tr>
              <tr className="border-t-2 border-green-200 bg-green-50">
                <td className="px-4 py-2.5 font-semibold text-gray-900">Maximo por partido</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-800 text-base">10 pts</td>
                <td className="px-4 py-2.5 text-center font-bold text-green-800 text-base">20 pts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Ejemplos */}
      <Section title="Ejemplos (Fase de Grupos)">
        <div className="space-y-3">
          <Example
            prediction="Colombia 2 - 1 Brasil"
            result="Colombia 2 - 1 Brasil"
            points={10}
            detail="Ganador + goles local + goles visitante + diferencia = 5+2+2+1"
          />
          <Example
            prediction="Colombia 2 - 1 Brasil"
            result="Colombia 3 - 1 Brasil"
            points={7}
            detail="Ganador + goles visitante + diferencia = 5+2+0"
          />
          <Example
            prediction="Colombia 2 - 1 Brasil"
            result="Colombia 1 - 0 Brasil"
            points={6}
            detail="Ganador + diferencia de goles (ambas +1) = 5+0+0+1"
          />
          <Example
            prediction="Colombia 2 - 1 Brasil"
            result="Colombia 2 - 0 Brasil"
            points={7}
            detail="Ganador + goles local = 5+2+0+0"
          />
          <Example
            prediction="Colombia 2 - 1 Brasil"
            result="Brasil 1 - 0 Colombia"
            points={0}
            detail="No acerto ganador ni goles ni diferencia"
          />
          <Example
            prediction="Colombia 1 - 1 Brasil"
            result="Colombia 2 - 2 Brasil"
            points={6}
            detail="Empate correcto + diferencia (0) = 5+0+0+1"
          />
        </div>
      </Section>

      {/* Desempate */}
      <Section title="Criterios de desempate">
        <p className="text-gray-600 text-sm mb-2">
          En caso de empate en puntos totales, se aplican los siguientes criterios en orden:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
          <li>Mayor cantidad de predicciones perfectas (10 o 20 pts)</li>
          <li>Mayor cantidad de predicciones con 7 pts (o 14 en eliminatorias)</li>
          <li>Mayor cantidad de predicciones con 6 pts (o 12 en eliminatorias)</li>
          <li>Mayor cantidad de predicciones con 5 pts (o 10 en eliminatorias)</li>
          <li>Fecha de registro mas temprana</li>
        </ol>
      </Section>

      {/* Premios */}
      <Section title="Informacion general">
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>Los resultados de los partidos se actualizan automaticamente.</li>
          <li>Los puntos se calculan automaticamente una vez finalizado cada partido.</li>
          <li>La tabla de posiciones se actualiza en tiempo real.</li>
          <li>Para cualquier duda o reclamo, contacta al administrador.</li>
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Example({
  prediction,
  result,
  points,
  detail,
}: {
  prediction: string
  result: string
  points: number
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Prediccion:</span>
          <span className="font-medium text-gray-800">{prediction}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Resultado:</span>
          <span className="font-medium text-gray-800">{result}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{detail}</p>
      </div>
      <span className={`text-lg font-bold shrink-0 ${points > 0 ? 'text-green-700' : 'text-gray-400'}`}>
        +{points}
      </span>
    </div>
  )
}
