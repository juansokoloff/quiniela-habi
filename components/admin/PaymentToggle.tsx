'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentToggleProps {
  userId: string
  currentStatus: string
}

export default function PaymentToggle({ userId, currentStatus }: PaymentToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const isApproved = status === 'approved'

  async function handleToggle() {
    setLoading(true)
    const newStatus = isApproved ? 'pending' : 'approved'

    const res = await fetch('/api/admin/payment-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newStatus }),
    })

    if (res.ok) {
      setStatus(newStatus)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
      style={{ backgroundColor: isApproved ? '#15803d' : '#d1d5db' }}
      title={isApproved ? 'Pago aprobado — clic para revocar' : 'Pago pendiente — clic para aprobar'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isApproved ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
