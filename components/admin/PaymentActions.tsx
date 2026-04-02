'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentActionsProps {
  receiptId: string
  userId: string
  currentStatus: string
}

export default function PaymentActions({ receiptId, userId, currentStatus }: PaymentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function handleApprove() {
    setLoading('approve')
    await fetch('/api/admin/payment-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', receiptId, userId }),
    })
    setLoading(null)
    router.refresh()
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setLoading('reject')
    await fetch('/api/admin/payment-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', receiptId, userId, reason: rejectReason }),
    })
    setLoading(null)
    setShowRejectForm(false)
    router.refresh()
  }

  if (currentStatus !== 'pending') return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {showRejectForm ? (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Razón del rechazo..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || loading === 'reject'}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading === 'reject' ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading === 'approve'}
            className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading === 'approve' ? 'Aprobando...' : 'Aprobar manualmente'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}
