import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'
import { uploadLimiter, rateLimitResponse } from '@/lib/ratelimit'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB — matches the UI hint

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { success, reset } = await uploadLimiter.limit(user.id)
  if (!success) return rateLimitResponse(reset)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
  }

  const extension = ALLOWED_TYPES[file.type]
  if (!extension) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  // Server-generated filename — never echo user-supplied names into storage paths.
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`
  const filePath = `${user.id}/${fileName}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('payment-receipts')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json(
      { error: 'Error al subir el archivo' },
      { status: 500 }
    )
  }

  const { data: { publicUrl } } = supabase.storage
    .from('payment-receipts')
    .getPublicUrl(filePath)

  // Insert payment receipt record
  const { data: receipt, error: insertError } = await supabase
    .from('payment_receipts')
    .insert({
      user_id: user.id,
      receipt_url: publicUrl,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError || !receipt) {
    console.error('Insert error:', insertError)
    return NextResponse.json(
      { error: 'Error al registrar el comprobante' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    receiptId: receipt.id,
    filePath,
    receiptUrl: publicUrl,
  })
}
