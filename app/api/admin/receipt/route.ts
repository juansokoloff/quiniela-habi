import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerUser } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createAdminClient()

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const receiptId = request.nextUrl.searchParams.get('id')
  if (!receiptId) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  // Get receipt record
  const { data: receipt } = await supabase
    .from('payment_receipts')
    .select('receipt_url, user_id')
    .eq('id', receiptId)
    .single()

  if (!receipt) {
    return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 })
  }

  // Extract file path from the receipt URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/payment-receipts/{userId}/{fileName}
  const urlParts = receipt.receipt_url.split('/payment-receipts/')
  const filePath = urlParts[1] // userId/fileName

  if (!filePath) {
    return NextResponse.json({ error: 'Ruta de archivo no válida' }, { status: 400 })
  }

  // Download the file using admin client
  const { data: fileData, error } = await supabase.storage
    .from('payment-receipts')
    .download(filePath)

  if (error || !fileData) {
    // Try signed URL as fallback
    const { data: signedData } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(filePath, 300)

    if (signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl)
    }

    return NextResponse.json({ error: 'No se pudo obtener el archivo' }, { status: 500 })
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const contentType = fileData.type || 'application/octet-stream'

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="receipt-${receiptId}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
