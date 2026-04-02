import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PAYMENT_VALIDATION_PROMPT = `Eres un asistente de validación de pagos para la Quiniela Habi del Mundial 2026.

Tu tarea es analizar el comprobante de pago que se te proporciona y determinar si es válido.

CRITERIOS DE VALIDACIÓN:
El comprobante es válido si cumple TODAS las siguientes condiciones:

1. DESTINATARIO: El pago debe estar dirigido a Beneficiary Name (puede aparecer como "Beneficiary Name" o variaciones del nombre).

2. DATOS DE DESTINO SEGÚN EL PAÍS:
   - COLOMBIA: El pago debe ser a Nequi, a la llave BreB con número [REDACTED-NEQUI]. Acepta si aparece el número [REDACTED-NEQUI] como destinatario o llave de pago.
   - MÉXICO: El pago debe ser a la cuenta CLABE [REDACTED-CLABE]. Acepta si aparece este número CLABE como destino.

3. TIPO DE DOCUMENTO: Debe ser un comprobante oficial de transferencia o pago bancario (Nequi, PSE, transferencia bancaria, SPEI, etc.). No se aceptan capturas de conversaciones ni promesas de pago.

4. ESTADO: El comprobante debe mostrar que el pago fue EXITOSO o COMPLETADO. No se aceptan pagos pendientes o fallidos.

5. MONTO:
   - COLOMBIA: El monto debe ser de $20,000 COP (veinte mil pesos colombianos). Acepta variaciones como 20.000, 20,000, $20000, etc.
   - MÉXICO: El monto debe ser de $100 MXN (cien pesos mexicanos). Acepta variaciones como $100.00, 100.00, etc.
   Si el monto es mayor al esperado, aprueba igualmente. Solo rechaza si el monto es MENOR al requerido.

6. FECHA: El comprobante debe ser de 2025 o 2026.

Si no puedes leer claramente los datos del comprobante, rechaza e indica qué información no fue legible.

Responde ÚNICAMENTE con el siguiente formato JSON:
{
  "approved": true/false,
  "reason": "Explicación breve de la decisión",
  "details": "Detalles adicionales observados en el comprobante"
}

No incluyas nada fuera del JSON.`

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const supabase = createAdminClient()

  const { receiptUrl, receiptId, filePath } = await request.json()

  if (!receiptId || !filePath) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Fetch the file from Supabase storage
  const { data: fileData } = await supabase.storage
    .from('payment-receipts')
    .download(filePath)

  if (!fileData) {
    return NextResponse.json({ error: 'No se pudo obtener el comprobante' }, { status: 400 })
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = fileData.type || 'image/jpeg'

  // Build content for Claude - PDFs use 'document' type, images use 'image' type
  const isPdf = mimeType === 'application/pdf'
  const fileContent = isPdf
    ? {
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: base64,
        },
      }
    : {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: base64,
        },
      }

  // Send to Claude for analysis
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          fileContent,
          {
            type: 'text',
            text: PAYMENT_VALIDATION_PROMPT,
          },
        ],
      },
    ],
  })

  let analysisText = message.content[0].type === 'text' ? message.content[0].text : '{}'

  // Strip markdown code fences if present (e.g. ```json ... ```)
  analysisText = analysisText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  let analysis: { approved: boolean; reason: string; details: string }
  try {
    analysis = JSON.parse(analysisText)
  } catch {
    analysis = {
      approved: false,
      reason: 'Error al analizar el comprobante',
      details: analysisText,
    }
  }

  const newStatus = analysis.approved ? 'approved' : 'rejected'

  // Update payment receipt with Claude's analysis
  await supabase
    .from('payment_receipts')
    .update({
      claude_analysis: analysisText,
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', receiptId)

  // Update user profile payment status
  if (analysis.approved) {
    await supabase
      .from('profiles')
      .update({
        payment_status: 'approved',
        payment_validated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  } else {
    await supabase
      .from('profiles')
      .update({
        payment_status: 'rejected',
        payment_rejection_reason: analysis.reason,
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ analysis, status: newStatus })
}
