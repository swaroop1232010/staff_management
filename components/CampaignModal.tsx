'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const DEFAULT_BEAUTY_COMBO_OFFER = `🎉 *Special Beauty Combos Now Available!*
✨ Starting from just *₹99 to ₹999!* 🌸

📍 *Visit Us:* *${SALON_CONFIG.name}*
${SALON_CONFIG.addressMedium}

📸 *Instagram:*
${SALON_CONFIG.instagramUrl}

📲 Call *${SALON_CONFIG.bookingPhone}* or Reply *BOOK* to grab your favourite combo! 💕`

function getCleanPhone(c: SegmentCustomer): string {
  return c.contact ? c.contact.replace(/\D/g, '') : ''
}

function getTenDigit(c: SegmentCustomer): string {
  const clean = getCleanPhone(c)
  return clean.length >= 10 ? clean.slice(-10) : clean
}

export default function CampaignModal({ isOpen, onClose }: CampaignModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const stopRequestedRef = useRef(false)
  const [customers, setCustomers] = useState<SegmentCustomer[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<string>>(new Set())
  const [invalidPhoneMap, setInvalidPhoneMap] = useState<Map<string, string>>(new Map())
  const [unsentPhoneMap, setUnsentPhoneMap] = useState<Map<string, string>>(new Map())
  const [previewCustomer, setPreviewCustomer] = useState<SegmentCustomer | null>(null)
  const [customOfferText, setCustomOfferText] = useState(DEFAULT_BEAUTY_COMBO_OFFER)
  const [imageUrl, setImageUrl] = useState(SALON_CONFIG.defaultCampaignFlyerUrl)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<any[] | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load previously messaged customer IDs from localStorage to avoid sending duplicates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('swasthik_campaign_sent_ids')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setSentCustomerIds(new Set(parsed))
          }
        }
      } catch (e) {
        console.warn('Error reading swasthik_campaign_sent_ids from localStorage', e)
      }
    }
  }, [isOpen])

  const isCustomerSent = useCallback(
    (c: SegmentCustomer) => {
      const cleanPhone = getCleanPhone(c)
      const tenDigit = getTenDigit(c)
      return (
        sentCustomerIds.has(c.id) ||
        (cleanPhone ? sentCustomerIds.has(cleanPhone) : false) ||
        (tenDigit ? sentCustomerIds.has(tenDigit) : false)
      )
    },
    [sentCustomerIds]
  )

  const getCustomerInvalidReason = useCallback(
    (c: SegmentCustomer) => {
      const cleanPhone = getCleanPhone(c)
      const tenDigit = getTenDigit(c)
      if (!cleanPhone || cleanPhone.length < 10) return 'Invalid phone number (< 10 digits)'
      if (invalidPhoneMap.has(tenDigit)) return invalidPhoneMap.get(tenDigit)
      if (invalidPhoneMap.has(cleanPhone)) return invalidPhoneMap.get(cleanPhone)
      return null
    },
    [invalidPhoneMap]
  )

  const getCustomerUnsentReason = useCallback(
    (c: SegmentCustomer) => {
      const cleanPhone = getCleanPhone(c)
      const tenDigit = getTenDigit(c)
      if (unsentPhoneMap.has(tenDigit)) return unsentPhoneMap.get(tenDigit)
      if (unsentPhoneMap.has(cleanPhone)) return unsentPhoneMap.get(cleanPhone)
      return null
    },
    [unsentPhoneMap]
  )

  const getCustomerFinalMessage = (c: SegmentCustomer) => {
    const text = customOfferText.trim()
    if (text.includes('{{Name}}')) {
      return text.replace(/\*?\{\{Name\}\}\*?/g, `*${c.firstName}*`)
    }
    if (text.startsWith('Hi ')) {
      return text
    }
    return `Hi *${c.firstName}* 👋💖\n\n${text}`
  }

  const fetchCampaignData = useCallback(async (segment: string) => {
    try {
      setLoading(true)
      setAlert(null)
      const url = segment === 'all' ? '/api/campaigns/send' : `/api/campaigns/send?segment=${segment}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        const loadedCustomers: SegmentCustomer[] = data.customers || []
        setCustomers(loadedCustomers)
        setSummary(data.segmentsSummary || {})

        // Read currently stored sent IDs
        let currentSent = new Set<string>()
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('swasthik_campaign_sent_ids')
            if (stored) {
              const parsed = JSON.parse(stored)
              if (Array.isArray(parsed)) currentSent = new Set(parsed)
            }
          } catch {
            // ignore
          }
        }

        // Live synchronize with UltraMsg gateway delivery history
        const ultra = data.ultraHistory
        if (ultra) {
          if (Array.isArray(ultra.sent)) {
            ultra.sent.forEach((phone: string) => {
              currentSent.add(phone)
            })
            try {
              localStorage.setItem(
                'swasthik_campaign_sent_ids',
                JSON.stringify(Array.from(currentSent))
              )
            } catch (e) {
              console.warn(e)
            }
          }

          // Populate invalid contacts from UltraMsg
          const newInvalidMap = new Map<string, string>()
          if (Array.isArray(ultra.invalid)) {
            ultra.invalid.forEach((item: { phone: string; reason?: string }) => {
              if (item.phone) newInvalidMap.set(item.phone, item.reason || 'Invalid WhatsApp contact')
            })
          }
          setInvalidPhoneMap(newInvalidMap)

          // Populate unsent contacts from UltraMsg
          const newUnsentMap = new Map<string, string>()
          if (Array.isArray(ultra.unsent)) {
            ultra.unsent.forEach((item: { phone: string; reason?: string }) => {
              if (item.phone) newUnsentMap.set(item.phone, item.reason || 'UltraMsg delivery error')
            })
          }
          setUnsentPhoneMap(newUnsentMap)
        }

        setSentCustomerIds(new Set(currentSent))

        // Auto-select only the first 10 eligible unsent & valid customers
        const unsentAndValid = loadedCustomers.filter((c) => {
          const clean = c.contact ? c.contact.replace(/\D/g, '') : ''
          const ten = clean.length >= 10 ? clean.slice(-10) : clean
          const isSent = currentSent.has(c.id) || (clean && currentSent.has(clean)) || (ten && currentSent.has(ten))
          const isInvalid = !clean || clean.length < 10 || (ultra?.invalid && ultra.invalid.some((inv: any) => inv.phone === ten || inv.phone === clean))
          return !isSent && !isInvalid
        })
        setSelectedIds(new Set(unsentAndValid.slice(0, 10).map((c) => c.id)))

        if (loadedCustomers.length > 0) {
          setPreviewCustomer(loadedCustomers[0])
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
    const c = customers.find((item) => item.id === id)
    if (c && (isCustomerSent(c) || getCustomerInvalidReason(c))) return

    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Batch selection helpers: select first 10, 50, all unsent, or clear
  const eligibleCustomers = customers.filter(
    (c) => !isCustomerSent(c) && !getCustomerInvalidReason(c)
  )

  const handleSelectBatch = (count: number) => {
    const batch = eligibleCustomers.slice(0, count).map((c) => c.id)
    setSelectedIds(new Set(batch))
  }

  const handleSelectAllUnsent = () => {
    setSelectedIds(new Set(eligibleCustomers.map((c) => c.id)))
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleResetSentHistory = () => {
    if (
      window.confirm(
        'Reset campaign sent history? This will unlock checkboxes for previously messaged clients in future campaigns.'
      )
    ) {
      try {
        localStorage.removeItem('swasthik_campaign_sent_ids')
        setSentCustomerIds(new Set())
        setAlert({
          type: 'success',
          message: 'Campaign sent history has been reset. All customers are now available.',
        })
      } catch (e) {
        console.warn(e)
      }
    }
  }

  const unsentCustomers = customers.filter((c) => !isCustomerSent(c))
  const sentCount = customers.filter((c) => isCustomerSent(c)).length
  const invalidCount = customers.filter((c) => !isCustomerSent(c) && getCustomerInvalidReason(c)).length
  const unsentCount = customers.filter(
    (c) => !isCustomerSent(c) && !getCustomerInvalidReason(c) && getCustomerUnsentReason(c)
  ).length

  const allEligibleSelected =
    eligibleCustomers.length > 0 && eligibleCustomers.every((c) => selectedIds.has(c.id))

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(eligibleCustomers.map((c) => c.id)))
    }
  }

  const handleSendCampaign = async (testOnly = false) => {
    const targets = customers
      .filter((c) => selectedIds.has(c.id) && !isCustomerSent(c))
      .map((c) => ({
        id: c.id,
        name: c.name,
        contact: c.contact,
        message: getCustomerFinalMessage(c),
      }))

    if (targets.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please select at least 1 unsent customer to send the campaign to.',
      })
      return
    }

    const sendList = testOnly ? targets.slice(0, 1) : targets
    stopRequestedRef.current = false

    try {
      setSending(true)
      setAlert(null)
      setProgress({ current: 0, total: sendList.length })

      const liveResults: any[] = []
      let successCount = 0

      for (let i = 0; i < sendList.length; i++) {
        // Check if user clicked Stop
        if (stopRequestedRef.current) {
          setAlert({
            type: 'success',
            message: `⏸️ Campaign stopped by user. Delivered to ${successCount} customers. Their checkboxes are locked and protected.`,
          })
          break
        }

        const recipient = sendList[i]
        setProgress({ current: i + 1, total: sendList.length })

        try {
          // Send 1 contact at a time to prevent serverless timeout & give real-time progress
          const res = await fetch('/api/campaigns/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipients: [recipient],
              imageUrl: imageUrl.trim(),
              testOnly: false,
            }),
          })

          const data = await res.json()
          const singleResult = data.results?.[0] || {
            id: recipient.id,
            name: recipient.name,
            contact: recipient.contact,
            success: Boolean(data.success),
            error: data.error || (data.success ? undefined : 'Delivery failed'),
          }

          liveResults.push(singleResult)
          setResults([...liveResults])

          if (singleResult.success) {
            successCount++
            const cleanPhone = recipient.contact ? recipient.contact.replace(/\D/g, '') : ''
            const tenDigit = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone

            // 1. Immediately update state so UI gets "✓ Sent (Protected)" tick
            setSentCustomerIds((prev) => {
              const updated = new Set(prev)
              if (recipient.id) updated.add(recipient.id)
              if (cleanPhone) updated.add(cleanPhone)
              if (tenDigit) updated.add(tenDigit)
              try {
                localStorage.setItem(
                  'swasthik_campaign_sent_ids',
                  JSON.stringify(Array.from(updated))
                )
              } catch (e) {
                console.warn(e)
              }
              return updated
            })

            // 2. Immediately uncheck from selectedIds so it cannot be resent
            setSelectedIds((prev) => {
              const next = new Set(prev)
              next.delete(recipient.id)
              return next
            })
          } else {
            // Track unsent or invalid reason
            const cleanPhone = recipient.contact ? recipient.contact.replace(/\D/g, '') : ''
            const tenDigit = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone
            const errStr = (singleResult.error || '').toLowerCase()
            if (errStr.includes('invalid') || cleanPhone.length < 10) {
              setInvalidPhoneMap((prev) => new Map(prev).set(tenDigit, singleResult.error || 'Invalid contact'))
            } else {
              setUnsentPhoneMap((prev) => new Map(prev).set(tenDigit, singleResult.error || 'UltraMsg delivery error'))
            }
          }
        } catch (itemErr: any) {
          const failedResult = {
            id: recipient.id,
            name: recipient.name,
            contact: recipient.contact,
            success: false,
            error: itemErr?.message || 'Network error',
          }
          liveResults.push(failedResult)
          setResults([...liveResults])

          const cleanPhone = recipient.contact ? recipient.contact.replace(/\D/g, '') : ''
          const tenDigit = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone
          setUnsentPhoneMap((prev) => new Map(prev).set(tenDigit, itemErr?.message || 'Network error'))
        }

        // Anti-ban protection delay: 5 seconds (5,000ms - 5,500ms) between messages
        if (i < sendList.length - 1 && !stopRequestedRef.current) {
          const safeDelay = 5000 + Math.floor(Math.random() * 500)
          await new Promise((resolve) => setTimeout(resolve, safeDelay))
        }
      }

      if (!stopRequestedRef.current) {
        setAlert({
          type: successCount > 0 ? 'success' : 'error',
          message: testOnly
            ? (successCount > 0
                ? `✅ Test campaign message delivered to ${sendList[0]?.name} (${sendList[0]?.contact})!`
                : `❌ Failed delivering test message to ${sendList[0]?.name}`)
            : `🎉 Campaign delivered to ${successCount} of ${sendList.length} customers successfully! Checkboxes are locked with ✓ Sent (Protected).`,
        })
      }
    } catch {
      setAlert({ type: 'error', message: 'Unexpected error during campaign dispatch' })
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
                  Every selected client will receive this message with their bolded name (e.g. *Hi \*Client_Name\* 👋💖*).
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
                <div className="flex items-center gap-2">
                  {imageUrl !== SALON_CONFIG.defaultCampaignFlyerUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(SALON_CONFIG.defaultCampaignFlyerUrl)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Default Flyer
                    </button>
                  )}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
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
              {/* Batch Action & Selection Header */}
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="checkbox"
                    checked={eligibleCustomers.length > 0 && allEligibleSelected}
                    disabled={eligibleCustomers.length === 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                    title={
                      eligibleCustomers.length === 0
                        ? 'All valid clients in this segment have already received the campaign'
                        : 'Select / Deselect all eligible clients'
                    }
                  />
                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-gray-700">
                    <span>
                      Selected (<strong className="text-emerald-700 font-extrabold">{selectedIds.size}</strong> of {eligibleCustomers.length} eligible)
                    </span>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span
                        className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5 shadow-2xs"
                        title="Clients delivered via UltraMsg (checkbox locked)"
                      >
                        <span>✓</span> {sentCount} Sent
                      </span>
                      {invalidCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 shadow-2xs"
                          title="Invalid phone number or not on WhatsApp"
                        >
                          <span>⚠️</span> {invalidCount} Invalid
                        </span>
                      )}
                      {unsentCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-0.5 shadow-2xs"
                          title="Failed delivery in UltraMsg (can be retried)"
                        >
                          <span>⚠️</span> {unsentCount} Unsent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch quick-selection filter buttons (10, 50, all unsent, clear) */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-gray-400 mr-0.5">Select:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectBatch(10)}
                    disabled={eligibleCustomers.length === 0}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                    title="Quick check first 10 eligible customers"
                  >
                    10 Clients
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectBatch(50)}
                    disabled={eligibleCustomers.length === 0}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                    title="Quick check first 50 eligible customers"
                  >
                    50 Clients
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllUnsent}
                    disabled={eligibleCustomers.length === 0}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer disabled:opacity-40"
                    title="Check all eligible customers"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                    title="Clear selected checkmarks"
                  >
                    Clear
                  </button>
                  {sentCustomerIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleResetSentHistory}
                      className="text-[10px] text-gray-400 hover:text-rose-600 underline ml-1 cursor-pointer"
                      title="Reset sent message history to unlock checkboxes"
                    >
                      Reset Sent Log
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Loading segment contacts & syncing live UltraMsg history...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No customers found in this segment.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {customers.map((c) => {
                    const isSent = isCustomerSent(c)
                    const invalidReason = getCustomerInvalidReason(c)
                    const unsentReason = getCustomerUnsentReason(c)
                    const isInvalid = Boolean(invalidReason)
                    const isDisabled = isSent || isInvalid
                    const isSelected = selectedIds.has(c.id) && !isDisabled
                    const isPreviewed = previewCustomer?.id === c.id

                    return (
                      <div
                        key={c.id}
                        onClick={() => setPreviewCustomer(c)}
                        className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isPreviewed
                            ? 'bg-emerald-50/80'
                            : isSent
                            ? 'bg-gray-50/70 opacity-80'
                            : isInvalid
                            ? 'bg-amber-50/40'
                            : unsentReason
                            ? 'bg-rose-50/40'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => !isDisabled && toggleSelectCustomer(c.id)}
                            className={`w-4 h-4 rounded transition-all ${
                              isDisabled
                                ? 'opacity-40 cursor-not-allowed bg-gray-200 accent-gray-400'
                                : 'text-emerald-600 cursor-pointer'
                            }`}
                            title={
                              isSent
                                ? 'Campaign message already delivered to this client. Checkbox is locked to prevent duplicate messages.'
                                : invalidReason
                                ? `Invalid Contact Number: ${invalidReason}`
                                : 'Select customer for campaign'
                            }
                          />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                              <span>{c.name}</span>
                              <span className="text-[10px] font-semibold text-gray-500">
                                ({c.contact})
                              </span>
                              {isSent ? (
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] border border-emerald-300 flex items-center gap-0.5">
                                  <span>✓</span> Sent (Protected)
                                </span>
                              ) : invalidReason ? (
                                <span
                                  className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold text-[9px] border border-amber-300 flex items-center gap-0.5"
                                  title={`UltraMsg: ${invalidReason}`}
                                >
                                  <span>⚠️</span> Invalid Number
                                </span>
                              ) : unsentReason ? (
                                <span
                                  className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-900 font-bold text-[9px] border border-rose-300 flex items-center gap-0.5"
                                  title={`UltraMsg: ${unsentReason}`}
                                >
                                  <span>⚠️</span> Unsent / Failed
                                </span>
                              ) : null}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
            <span>🛡️ Anti-Ban Protection Active:</span>
            <span className="font-normal text-gray-600">
              5s human-paced delay between dispatches keeps your WhatsApp number safe from spam blocks.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Close
            </button>
            {sending && (
              <button
                type="button"
                onClick={() => {
                  stopRequestedRef.current = true
                }}
                className="px-3.5 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Pause campaign dispatch. All contacts already delivered will remain locked and protected."
              >
                <span>🛑</span> Stop Sending
              </button>
            )}
            {!sending && (
              <button
                onClick={() => handleSendCampaign(true)}
                disabled={sending || selectedIds.size === 0}
                className="px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Test sends to only the first selected customer"
              >
                🧪 Test Send 1 Contact
              </button>
            )}
            <button
              onClick={() => handleSendCampaign(false)}
              disabled={sending || selectedIds.size === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    Sending {progress ? `${progress.current}/${progress.total} (Paced 5s)` : 'Campaign'}...
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
