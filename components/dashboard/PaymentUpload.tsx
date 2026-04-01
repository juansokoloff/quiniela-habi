'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface PaymentUploadProps {
  userId: string
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'approved' | 'rejected'

export default function PaymentUpload({ userId }: PaymentUploadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ reason: string; details: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!validTypes.includes(selected.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB')
      return
    }

    setError(null)
    setFile(selected)
    if (selected.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(selected))
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (!file) return
    setError(null)
    setState('uploading')

    const supabase = createClient()
    const receiptId = `${Date.now()}-${file.name}`
    const filePath = `${userId}/${receiptId}`

    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, file)

    if (uploadError) {
      setError('Error al subir el archivo. Intenta nuevamente.')
      setState('idle')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(filePath)

    // Save receipt record
    const { data: receipt } = await supabase
      .from('payment_receipts')
      .insert({
        user_id: userId,
        receipt_url: publicUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (!receipt) {
      setError('Error al registrar el comprobante.')
      setState('idle')
      return
    }

    // Validate with Claude
    setState('analyzing')
    const response = await fetch('/api/payment-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptUrl: publicUrl, receiptId: receipt.id }),
    })

    const data = await response.json()

    if (data.status === 'approved') {
      setState('approved')
      setTimeout(() => {
        router.push('/predictions')
        router.refresh()
      }, 2000)
    } else {
      setState('rejected')
      setResult({
        reason: data.analysis?.reason || 'Comprobante no válido',
        details: data.analysis?.details || '',
      })
    }
  }

  if (state === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-green-800">¡Pago aprobado!</h2>
        <p className="text-green-600 text-sm mt-1">Redirigiendo a tus predicciones...</p>
      </div>
    )
  }

  if (state === 'rejected' && result) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800">Comprobante rechazado</h2>
          <p className="text-red-600 text-sm mt-2">{result.reason}</p>
          {result.details && (
            <p className="text-red-500 text-xs mt-2">{result.details}</p>
          )}
        </div>
        <button
          onClick={() => {
            setState('idle')
            setFile(null)
            setPreview(null)
            setResult(null)
          }}
          className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
        >
          Intentar con otro comprobante
        </button>
      </div>
    )
  }

  const isProcessing = state === 'uploading' || state === 'analyzing'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50/30'
        } ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {preview ? (
          <img src={preview} alt="Comprobante" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm">
              {file ? file.name : 'Haz clic para subir tu comprobante'}
            </p>
            <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP o PDF · Máx. 10MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      {isProcessing && (
        <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-lg px-4 py-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            {state === 'uploading' ? 'Subiendo comprobante...' : 'Claude está verificando tu pago...'}
          </span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar comprobante
      </button>
    </div>
  )
}
