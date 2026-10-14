'use client'

import { useState, useEffect, useCallback } from 'react'
import { SALON_CONFIG } from '@/lib/salonConfig'

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SegmentCustomer {
  id: string
  name: string
  firstName: string
  contact: string
  services: string[]
  primaryCategory: string
  categoryLabel: string
  lastVisitDate?: string
  totalSpent?: number
  personalizedMessage: string
}

const DEFAULT_BEAUTY_COMBO_OFFER = `✨ *Special Beauty Combos at Swasthik Salon & Boutique!* ✨

Pamper yourself with amazing beauty combos starting from just ₹99 to ₹999! ❤️

Threading, waxing, facials, manicure, pedicure & much more — choose your favourite combo according to your budget!

💖 Visit us and treat yourself to the beauty you deserve!

📍 14th Cross Road, Ravindra Nagar, Near DMart, Magunta Layout, Nellore.

👉 *Visit our Instagram:*
https://instagram.com/swasthik_makeover_nellore

👉 Reply *"BOOK"* or call 9110365226 to reserve your slot!`

export default function CampaignModal({ isOpen, onClose }: CampaignModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [customers, setCustomers] = useState<SegmentCustomer[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewCustomer, setPreviewCustomer] = useState<SegmentCustomer | null>(null)
  const [customOfferText, setCustomOfferText] = useState(DEFAULT_BEAUTY_COMBO_OFFER)
  const [imageUrl, setImageUrl] = useState('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<any[] | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const getCustomerFinalMessage = (c: SegmentCustomer) => {
    const text = customOfferText.trim()
    const hasFooter = text.includes('📍') || text.includes('Ravindra Nagar') || text.includes('9110365226')
    if (hasFooter) {
      return `Hi ${c.firstName} 👋\n\n${text}`
    }
    return `Hi ${c.firstName} 👋\n\n${text}\n\n📍 *${SALON_CONFIG.brandName}*\n${SALON_CONFIG.addressShort}\n👉 *Visit our Instagram:* ${SALON_CONFIG.instagramUrl}\n👉 Reply *"BOOK"* or call 9110365226 to reserve your slot!`
  }

  const fetchCampaignData = useCallback(async (segment: string) => {
    try {
      setLoading(true)
      setAlert(null)
      const url = segment === 'all' ? '/api/campaigns/send' : `/api/campaigns/send?segment=${segment}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setCustomers(data.customers || [])
        setSummary(data.segmentsSummary || {})
        // Auto-select all filtered customers by default
        setSelectedIds(new Set((data.customers || []).map((c: any) => c.id)))
        if (data.customers && data.customers.length > 0) {
          setPreviewCustomer(data.customers[0])
        }
      } else {
        setAlert({ type: 'error', message: data.error || 'Failed to load campaign contacts' })
      }
    } catch {
      setAlert({ type: 'error', message: 'Network error connecting to campaign server' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setResults(null)
      setProgress(null)
      fetchCampaignData(selectedSegment)
    }
  }, [isOpen, selectedSegment, fetchCampaignData])

  const toggleSelectCustomer = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)))
    }
  }

  const handleSendCampaign = async (testOnly = false) => {
    const targets = customers
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        contact: c.contact,
        message: getCustomerFinalMessage(c),
      }))

    if (targets.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least 1 customer to send the campaign to.' })
      return
    }

    const sendList = testOnly ? targets.slice(0, 1) : targets

    try {
      setSending(true)
      setAlert(null)
      setProgress({ current: 0, total: sendList.length })

      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: sendList,
          imageUrl: imageUrl.trim(),
          testOnly,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResults(data.results || [])
        setAlert({
          type: 'success',
          message: testOnly
            ? `✅ Test campaign message sent successfully to ${sendList[0]?.name} (${sendList[0]?.contact})!`
            : `🎉 Campaign delivered to ${data.sentCount} customers successfully! (${data.failedCount} failed)`,
        })
      } else {
        setAlert({ type: 'error', message: data.error || 'Failed sending campaign via UltraMsg' })
      }
    } catch {
      setAlert({ type: 'error', message: 'Network error during campaign dispatch' })
    } finally {
      setSending(false)
      setProgress(null)
    }
  }

  if (!isOpen) return null

  const totalContacts = Object.values(summary).reduce((a, b) => a + b, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shadow-inner">
              📢
            </div>
            <div>
              <h2 className="text-lg font-bold">Service-Wise WhatsApp Campaigns</h2>
              <p className="text-xs text-emerald-100">
                Auto-segments customers by past services & delivers tailored WhatsApp offers
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

        {/* Segment Filter Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px] whitespace-nowrap mr-1">
              Filter by Service Segment:
            </span>
            <button
              onClick={() => setSelectedSegment('all')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedSegment === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>🌟</span>
              <span>All Clients (Smart Auto-Segment)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {totalContacts}
              </span>
            </button>

            {[
              { id: 'hair_treatment', label: 'Hair Spa & Colour', icon: '🎨' },
              { id: 'facial', label: 'Facial & Glow Care', icon: '✨' },
              { id: 'nails', label: 'Mani & Pedi', icon: '💅' },
              { id: 'bridal_makeup', label: 'Bridal & Glam Make-Up', icon: '💄' },
              { id: 'hair_cut', label: 'Hair Cut & Styling', icon: '💇' },
            ].map((seg) => {
              const count = summary[seg.id] || 0
              if (count === 0 && selectedSegment !== seg.id) return null
              const isActive = selectedSegment === seg.id
              return (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{seg.icon}</span>
                  <span>{seg.label}</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Alert */}
          {alert && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                alert.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              <span>{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="opacity-70 hover:opacity-100 text-sm ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Campaign Broadcast Message */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>📢</span> Campaign Broadcast Message (Sent to all selected clients)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Every selected client will receive this message with their name (*Hi Client_Name 👋*).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomOfferText(DEFAULT_BEAUTY_COMBO_OFFER)}
                className="text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                🔄 Reset to Beauty Combos
              </button>
            </div>

            <textarea
              rows={6}
              value={customOfferText}
              onChange={(e) => setCustomOfferText(e.target.value)}
              placeholder="Type or paste your offer headline and discount details here..."
              className="w-full text-xs p-3 rounded-lg border border-emerald-200 bg-white focus:outline-emerald-500 font-medium leading-relaxed font-sans"
            />

            {/* Optional Banner Image URL */}
            <div className="pt-2 border-t border-emerald-200/60">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>🖼️</span> Attach Offer Flyer Image (Optional)
                </label>
                {imageUrl && (
                  <button
                    onClick={() => setImageUrl('')}
                    className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Image
                  </button>
                )}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste public image URL (e.g. https://example.com/flyer.jpg or Cloudinary/Imgur link)"
                className="w-full text-xs p-2 rounded-lg border border-emerald-200 bg-white focus:outline-emerald-500 font-medium"
              />
              <p className="text-[10px] text-emerald-800 mt-1">
                💡 When an image is attached, WhatsApp delivers the photo flyer with your offer message as the caption!
              </p>
            </div>
          </div>

          {/* Grid Layout: Recipients List on Left, Live Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Recipients Selection Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.size === customers.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    Selected ({selectedIds.size} of {customers.length})
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">
                  Click customer to view message
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Loading segment contacts...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No customers found in this segment.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {customers.map((c) => {
                    const isSelected = selectedIds.has(c.id)
                    const isPreviewed = previewCustomer?.id === c.id

                    return (
                      <div
                        key={c.id}
                        onClick={() => setPreviewCustomer(c)}
                        className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isPreviewed ? 'bg-emerald-50/80' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelectCustomer(c.id)}
                            className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-[10px] font-semibold text-gray-500">
                                ({c.contact})
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-700 font-semibold text-[10px]">
                                {c.categoryLabel}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">
                                {c.services.join(', ') || 'General Visit'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewCustomer(c)
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Preview 💬
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Individual Message Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center justify-between">
                <span>💬 WhatsApp Preview</span>
                {previewCustomer && (
                  <span className="text-emerald-700 font-bold capitalize">
                    For: {previewCustomer.firstName}
                  </span>
                )}
              </div>

              <div className="bg-[#e5ddd5]/30 p-3.5 rounded-xl border border-gray-200 flex-1 flex flex-col">
                <div className="bg-white p-3.5 rounded-xl shadow-xs text-xs font-mono leading-relaxed whitespace-pre-wrap text-gray-800 border border-gray-100 flex-1 overflow-y-auto max-h-72">
                  {imageUrl.trim() && (
                    <div className="mb-2.5 rounded-lg overflow-hidden border border-emerald-200/80 bg-gray-50 flex flex-col items-center justify-center">
                      <img
                        src={imageUrl.trim()}
                        alt="Offer Flyer Preview"
                        className="max-h-48 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <span className="text-[10px] text-gray-500 py-1 font-sans">
                        🖼️ Attached WhatsApp Offer Flyer
                      </span>
                    </div>
                  )}
                  {previewCustomer
                    ? getCustomerFinalMessage(previewCustomer)
                    : 'Select a customer on the left to see their personalized WhatsApp message'}
                </div>

                {previewCustomer && (
                  <div className="mt-2 text-[10px] text-gray-500 text-center">
                    Segment: <strong>{previewCustomer.categoryLabel}</strong> • Services: {previewCustomer.services.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Summary if Dispatched */}
          {results && results.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <h4 className="text-xs font-bold text-gray-800">
                📊 Dispatch Report ({results.filter((r) => r.success).length} of {results.length} Sent Successfully)
              </h4>
              <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto bg-white rounded-lg border border-gray-200 text-xs">
                {results.map((r, i) => (
                  <div key={i} className="p-2 flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {r.name} ({r.contact})
                    </span>
                    <span
                      className={`font-bold text-[11px] ${
                        r.success ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {r.success ? '✓ Delivered via UltraMsg' : `✗ Failed: ${r.error || 'Unknown'}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            Messages are paced safely (500ms delay) from your business WhatsApp gateway.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => handleSendCampaign(true)}
              disabled={sending || selectedIds.size === 0}
              className="px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Test sends to only the first selected customer"
            >
              🧪 Test Send 1 Contact
            </button>
            <button
              onClick={() => handleSendCampaign(false)}
              disabled={sending || selectedIds.size === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    Sending {progress ? `${progress.current}/${progress.total}` : 'Campaign'}...
                  </span>
                </>
              ) : (
                <>
                  <span>🚀 Send to All Selected ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
