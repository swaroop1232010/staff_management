'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth } from 'date-fns'
import { SALON_CONFIG } from '@/lib/salonConfig'

interface EodModalProps {
  isOpen: boolean
  onClose: () => void
}

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom'

export default function EodWhatsAppModal({ isOpen, onClose }: EodModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Date filter state
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const [activePreset, setActivePreset] = useState<DatePreset>('today')
  const [startDate, setStartDate] = useState(todayIso)
  const [endDate, setEndDate] = useState(todayIso)

  const fetchReport = useCallback(async (sDate: string, eDate: string) => {
    try {
      setLoading(true)
      setStatusMessage(null)
      const res = await fetch(`/api/reports/eod?startDate=${sDate}&endDate=${eDate}`)
      const data = await res.json()
      if (data.success) {
        setReportData(data)
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to generate AI report' })
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error connecting to report server' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchReport(startDate, endDate)
    }
  }, [isOpen, fetchReport, startDate, endDate])

  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset)
    const today = new Date()

    let s = todayIso
    let e = todayIso

    if (preset === 'today') {
      s = todayIso
      e = todayIso
    } else if (preset === 'yesterday') {
      const yest = format(subDays(today, 1), 'yyyy-MM-dd')
      s = yest
      e = yest
    } else if (preset === 'last7days') {
      s = format(subDays(today, 6), 'yyyy-MM-dd')
      e = todayIso
    } else if (preset === 'thisMonth') {
      s = format(startOfMonth(today), 'yyyy-MM-dd')
      e = todayIso
    }

    if (preset !== 'custom') {
      setStartDate(s)
      setEndDate(e)
      fetchReport(s, e)
    }
  }

  const handleApplyCustomDates = () => {
    fetchReport(startDate, endDate)
  }

  const handleSendToOwner = async () => {
    try {
      setSending(true)
      setStatusMessage(null)
      const res = await fetch('/api/reports/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          customMessage: reportData?.preview,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ Report sent to Owner (${SALON_CONFIG.ownerPhone}) successfully via UltraMsg! (Message ID: ${data.messageId || 'ok'})`,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: `❌ Delivery error: ${data.error || 'UltraMsg delivery failed'}`,
        })
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error calling EOD report API' })
    } finally {
      setSending(false)
    }
  }

  const handleCopyText = () => {
    if (reportData?.preview) {
      navigator.clipboard.writeText(reportData.preview)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shadow-inner">
              📱
            </div>
            <div>
              <h2 className="text-lg font-bold">Owner WhatsApp EOD Report & AI Advisory</h2>
              <p className="text-xs text-emerald-100">
                UltraMsg Business Gateway • Direct to Owner ({SALON_CONFIG.ownerPhone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Schedule Banner Rule */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="text-base">⏰</span>
              <span>
                <strong>Auto-Schedule:</strong> Set for <strong>9:00 PM daily</strong>. Sends <em>only if leads or walk-ins occurred today</em>.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 font-bold text-[10px] uppercase text-emerald-800">
              Active
            </span>
          </div>

          {/* Date Range Filter Bar */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <span>🗓️</span> Select Date Period for AI Report:
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last7days', label: 'Last 7 Days' },
                  { id: 'thisMonth', label: 'This Month' },
                  { id: 'custom', label: 'Custom' },
                ].map((preset) => {
                  const isActive = activePreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id as DatePreset)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Date Pickers */}
            {activePreset === 'custom' && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-emerald-500 font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-emerald-500 font-medium"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleApplyCustomDates}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Generate AI Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="opacity-70 hover:opacity-100 text-sm ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {/* Message Preview Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <span>💬</span> WhatsApp Message Preview (Direct to Owner)
              </label>
              <button
                onClick={handleCopyText}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? '✓ Copied' : '📋 Copy Text'}
              </button>
            </div>

            {loading ? (
              <div className="h-52 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Analyzing data and crafting AI recommendations...</span>
              </div>
            ) : (
              <div className="bg-[#e5ddd5]/35 p-3.5 rounded-xl border border-gray-200">
                <div className="bg-white p-4 rounded-xl shadow-xs text-xs font-mono leading-relaxed whitespace-pre-wrap text-gray-800 border border-gray-100 max-h-72 overflow-y-auto">
                  {reportData?.preview || 'No report preview generated for selected dates'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            Recipient: <strong>{SALON_CONFIG.ownerPhone}</strong> (Salon Owner)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSendToOwner}
              disabled={sending || loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending to Owner WhatsApp...</span>
                </>
              ) : (
                <>
                  <span>📱 Send to Owner Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
