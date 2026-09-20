'use client'

import { useState } from 'react'
import { normalizePhone, isValidPhone } from '@/lib/phone'

interface PhoneLookupStepProps {
  onFound: (result: {
    exists: boolean
    phone: string
    customer?: {
      name: string
      contact: string
      email?: string
      photo?: string
    }
    history?: Array<{
      id: string
      visitDate: string
      services: string[]
      serviceTakenBy?: string
      amount: number
      discount: number
      finalAmount: number
      paymentType: string
      notes?: string
    }>
    currentMonthTotal?: number
    currentMonthName?: string
    rewardThreshold?: number
    isEligibleForReward?: boolean
  }) => void
  onCancel: () => void
}

export default function PhoneLookupStep({ onFound, onCancel }: PhoneLookupStepProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s+-]/g, '')
    setPhone(val)
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = normalizePhone(phone)
    if (!isValidPhone(cleaned)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(cleaned)}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to lookup customer')
      }
      const data = await res.json()
      onFound(data)
    } catch (err: any) {
      setError(err.message || 'Error looking up customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="card p-8 shadow-lg border border-gray-100 bg-white rounded-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter mobile number to check for existing record or register a new customer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="lookup-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm font-semibold">
                +91
              </div>
              <input
                id="lookup-phone"
                type="tel"
                autoFocus
                value={phone}
                onChange={handleInputChange}
                placeholder="98765 43210"
                className="input-field pl-12 text-lg font-medium tracking-wide"
                maxLength={14}
              />
            </div>
            {error && <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>}
          </div>

          <div className="flex flex-col space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={loading || normalizePhone(phone).length !== 10}
              className="btn-primary w-full py-3 text-base flex justify-center items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching...
                </>
              ) : (
                'Continue / Search Customer'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary w-full py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
