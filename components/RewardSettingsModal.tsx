'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface RewardSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RewardSettingsModal({ isOpen, onClose }: RewardSettingsModalProps) {
  const [threshold, setThreshold] = useState<number>(5000)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.monthlyRewardThreshold) {
            setThreshold(data.monthlyRewardThreshold)
          }
        })
        .catch(() => toast.error('Failed to load settings'))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (threshold < 0) {
      toast.error('Threshold must be at least ₹0')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyRewardThreshold: Number(threshold) }),
      })

      if (res.ok) {
        toast.success('Monthly reward threshold updated!')
        onClose()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to update threshold')
      }
    } catch {
      toast.error('Network error updating settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🎁</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Monthly Reward Threshold</h3>
            <p className="text-xs text-gray-500">Configure customer gift eligibility threshold</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm">Loading settings...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threshold Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
                  className="input-field pl-9 text-lg font-semibold"
                  placeholder="5000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                When a customer&apos;s total spending in the current calendar month reaches or exceeds this value, staff will see the gift prompt.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Threshold'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
