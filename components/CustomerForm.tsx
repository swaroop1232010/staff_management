'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import PhoneLookupStep from './PhoneLookupStep'
import { normalizePhone, isValidPhone } from '@/lib/phone'

interface Staff {
  id: string
  name: string
  position: string
  isActive: boolean
}

interface VisitHistoryItem {
  id: string
  visitDate: string
  services: string[]
  serviceTakenBy?: string
  amount: number
  discount: number
  finalAmount: number
  paymentType: string
  notes?: string
}

interface ExistingCustomerData {
  name: string
  contact: string
  email?: string
  photo?: string
}

interface LookupResult {
  exists: boolean
  phone: string
  customer?: ExistingCustomerData
  history?: VisitHistoryItem[]
  currentMonthTotal?: number
  currentMonthName?: string
  rewardThreshold?: number
  isEligibleForReward?: boolean
}

interface CustomerFormProps {
  onSuccess: () => void
  initialData?: any
}

// 13 Predefined categories with full service catalogue
const SERVICE_CATEGORIES = [
  {
    category: 'Threading',
    services: ['Eyebrow', 'Upper Lip', 'Forehead', 'Chin', 'Full Face', 'Side Locks', 'Neck'],
  },
  {
    category: 'Hair Services',
    services: [
      'Basic Hair Cut', 'U-Cut', 'V-Cut', 'Step Cut', 'Layer Cut', 'Feather Cut',
      'Butterfly Cut', 'Bob Cut', 'Blunt Cut', 'Front Layers', 'Curtain Bangs',
      'Hair Trim', 'Kids Hair Cut', 'Hair Wash', 'Blow Dry',
    ],
  },
  {
    category: 'Hair Colour',
    services: [
      'Global Hair Colour', 'Root Touch-Up', 'Grey Hair Coverage', 'Global Black Colour',
      'Fashion Hair Colour', 'Highlights', 'Lowlights', 'Balayage', 'Ombre', 'Streaks',
      'Front Hair Colour', 'Underlayer Hair Colour', 'Colour Correction',
    ],
  },
  {
    category: 'Facial Service',
    services: [
      'Clean-up', 'Fruit Facial', 'Gold Facial', 'Wine Facial', 'Glow Facial',
      'Whitening Facial', 'Instant Facial', 'D-Tan Facial', 'Herbal Facial',
      'Daimond Facial', 'Pearl Facial', 'Luxury Gold Facial', 'O3 Facial',
      'Sea Saw Facial', 'Chocolate Facial', 'Radiant Facial', 'Bridal Facial',
      'Acne/Anti-Pimple Facial', 'Hydrating Facial', 'Hydra Facial', 'Pigmentation Facial',
    ],
  },
  {
    category: 'PMU (Permanent Make-Up)',
    services: [
      'Microblading – Eyebrow Enhancement', 'Ombre/Powder Brows', 'Combination Brows',
      'Lip Blush', 'Lip Neutralization', 'Eyeliner / Lash Line Enhancement',
      'Beauty Mark / Mole Enhancement', 'PMU Colour Correction / Touch-Up',
      'Annual/Follow-up Touch-Up',
    ],
  },
  {
    category: 'Hair Treatments',
    services: [
      'Hair Spa', 'Keratin Treatment', 'Smoothening', 'Hair Straightening', 'Hair Botox',
      'Cysteine Treatment', 'Protein Treatment', 'Hair Fall Treatment',
      'Anti-Dandruff Treatment', 'Scalp Treatment', 'Dry & Damaged Hair Treatment',
      'Frizzy Hair Treatment', 'Split-End Treatment', 'Deep Conditioning', 'Hair Detox Treatment',
    ],
  },
  {
    category: 'Manicure Services',
    services: [
      'Basic Manicure', 'Spa Manicure', 'Charcoal Manicure', 'Crystal Manicure',
      'Ice Cream Manicure', 'Nail Shaping & Buffing', 'Cuticle Care',
      'Hand Scrub & Polish', 'Hand Massage',
    ],
  },
  {
    category: 'Pedicure Services',
    services: [
      'Basic Pedicure', 'Spa Pedicure', 'Crystal Pedicure', 'Ice Cream Pedicure',
      'Charcoal Pedicure', 'Foot Scrub', 'Cuticle & Nail Care', 'Heel Care',
      'Foot Massage', 'Dead Skin Removal',
    ],
  },
  {
    category: 'Waxing',
    services: [
      'Full Arms Wax', 'Half Arms Wax', 'Underarms Wax', 'Full Legs Wax', 'Half Legs Wax',
      'Full Body Wax', 'Back Wax', 'Front Body Wax', 'Stomach Wax', 'Bikini Line Wax',
      'Face Wax', 'Hand Wax', 'Foot Wax',
    ],
  },
  {
    category: 'D-Tan Packs',
    services: [
      'Face D-Tan', 'Face & Neck D-Tan', 'Hands D-Tan', 'Legs D-Tan',
      'Back D-Tan', 'Neck D-Tan', 'Full Body D-Tan',
    ],
  },
  {
    category: 'Packs',
    services: [
      'Peel-Off Mask', 'Sheet Mask', 'Clay Mask', 'Charcoal Mask', 'Gold Mask',
      'Collagen Mask', 'Gel Mask', 'Aloe Vera Mask', 'Hydrating Mask',
      'Brightening Mask', 'De-Tan Mask', 'Anti-Pimple Mask',
      'Cooling & Soothing Mask', 'Rubber Mask / Alginate Mask',
    ],
  },
  {
    category: 'Nail Extensions',
    services: [
      'Basic Nail Polish', 'French Nail Polish', 'Gel Polish', 'Gel Polish Removal',
      'Nail Shaping & Buffing', 'Nail Art', 'Glitter Nail Polish', 'Chrome Nail Finish',
      'Matte Nail Finish', 'Nail Extension', 'Nail Extension Removal',
    ],
  },
  {
    category: 'Make-Up',
    services: [
      'Basic Makeup', 'Party Makeup', 'Engagement Makeup', 'Reception Makeup',
      'Bridal Makeup', 'HD Makeup', 'Airbrush Makeup', 'Sangeet Makeup',
      'Baby Shower / Maternity Makeup', 'Photoshoot Makeup', 'Saree Draping',
      'Hairstyling', 'Makeup + Hairstyle Combo', 'Bridal Makeup + Hairstyle + Saree Draping',
    ],
  },
]

// Category keywords / aliases map
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Threading': ['threading', 'thread', 'eyebrow', 'brow', 'upper lip', 'forehead', 'chin', 'full face', 'side locks', 'neck'],
  'Hair Services': ['hair services', 'haircut', 'hair cut', 'cut', 'u-cut', 'v-cut', 'step cut', 'layer cut', 'feather cut', 'butterfly cut', 'bob cut', 'blunt cut', 'front layers', 'curtain bangs', 'hair trim', 'trim', 'kids hair cut', 'hair wash', 'blow dry'],
  'Hair Colour': ['hair colour', 'hair color', 'colour', 'color', 'highlight', 'highlights', 'lowlights', 'global', 'grey hair', 'fashion hair', 'balayage', 'ombre', 'streaks', 'root touch', 'colour correction'],
  'Facial Service': ['facial service', 'facial', 'facials', 'cleanup', 'clean-up', 'clean up', 'fruit facial', 'gold facial', 'wine facial', 'glow facial', 'whitening facial', 'instant facial', 'd-tan facial', 'herbal facial', 'diamond facial', 'daimond facial', 'pearl facial', 'luxury gold', 'o3 facial', 'sea saw facial', 'chocolate facial', 'radiant facial', 'bridal facial', 'acne facial', 'hydrating facial', 'hydra facial', 'pigmentation facial'],
  'PMU (Permanent Make-Up)': ['pmu', 'permanent', 'make-up', 'makeup', 'microblading', 'powder brows', 'combination brows', 'lip blush', 'lip neutralization', 'eyeliner', 'beauty mark', 'mole'],
  'Hair Treatments': ['hair treatments', 'treatment', 'treatments', 'hair spa', 'keratin', 'smoothening', 'straightening', 'hair botox', 'cysteine', 'protein treatment', 'hair fall', 'anti-dandruff', 'scalp treatment', 'dry hair', 'frizzy hair', 'split-end', 'deep conditioning', 'hair detox'],
  'Manicure Services': ['manicure', 'mani', 'hand', 'hands', 'nail shaping', 'cuticle care', 'hand scrub', 'hand massage', 'spa manicure', 'ice cream manicure'],
  'Pedicure Services': ['pedicure', 'pedi', 'foot', 'feet', 'heel care', 'foot scrub', 'dead skin', 'foot massage', 'spa pedicure', 'crystal pedicure'],
  'Waxing': ['waxing', 'wax', 'arms wax', 'legs wax', 'underarms', 'body wax', 'bikini line', 'face wax', 'hand wax', 'foot wax', 'stomach wax'],
  'D-Tan Packs': ['d-tan packs', 'dtan', 'd-tan', 'de-tan', 'detan', 'tan pack', 'face d-tan', 'neck d-tan', 'hands d-tan', 'legs d-tan', 'full body d-tan'],
  'Packs': ['packs', 'pack', 'mask', 'masks', 'peel-off', 'sheet mask', 'clay mask', 'charcoal mask', 'gold mask', 'collagen mask', 'gel mask', 'aloe vera', 'brightening mask', 'de-tan mask', 'rubber mask'],
  'Nail Extensions': ['nail extensions', 'extension', 'extensions', 'nail polish', 'gel polish', 'nail art', 'glitter nail', 'chrome nail', 'matte nail'],
  'Make-Up': ['make-up', 'makeup', 'make up', 'bridal makeup', 'party makeup', 'engagement makeup', 'reception makeup', 'hd makeup', 'airbrush', 'saree draping', 'saree', 'hairstyling', 'combo'],
}

// Child service keyword aliases map
const SERVICE_ALIASES: Record<string, string[]> = {
  'Eyebrow': ['eyebrow threading', 'threading eyebrow', 'brow', 'brows', 'eyebrows', 'thread'],
  'Upper Lip': ['upper lip threading', 'threading upper lip', 'upperlip', 'lip threading'],
  'Forehead': ['forehead threading', 'threading forehead'],
  'Chin': ['chin threading', 'threading chin'],
  'Full Face': ['full face threading', 'threading full face', 'face threading'],
  'Side Locks': ['side locks threading', 'sidelocks', 'sidelock'],
  'Neck': ['neck threading', 'threading neck'],
  'Basic Hair Cut': ['haircut', 'hair cut', 'basic cut'],
  'Hair Trim': ['trim', 'trimming'],
  'Kids Hair Cut': ['kids cut', 'child hair cut'],
  'Hair Wash': ['wash', 'shampoo'],
  'Blow Dry': ['dry', 'blowdry'],
  'Clean-up': ['cleanup', 'clean up'],
  'D-Tan Facial': ['dtan facial', 'detan facial'],
  'Daimond Facial': ['diamond facial', 'diamond', 'daimond'],
  'Sea saw Facial': ['sea saw', 'seesaw facial', 'see saw'],
  'Luxury Gold Facial': ['luxury gold', 'gold luxury'],
  'Hair Spa': ['spa'],
  'Hair Straightening': ['straightening', 'rebonding'],
  'Smoothening': ['smoothening', 'hair smoothening'],
  'Hair Botox': ['botox'],
  'Deep Conditioning': ['conditioning'],
  'Underarms Wax': ['underarm', 'underarms', 'armpit'],
  'Bikini Line Wax': ['bikini'],
  'Face D-Tan': ['face dtan', 'face detan', 'dtan face'],
  'De-Tan Mask': ['dtan mask', 'detan mask'],
  'Nail Shaping & Buffing': ['buffing', 'shaping'],
  'Nail Art': ['nail design'],
  'Saree Draping': ['saree', 'sari', 'draping'],
  'Hairstyling': ['hair style', 'hairstyles'],
}

const ALL_KNOWN_SERVICES = SERVICE_CATEGORIES.flatMap(c => c.services)

export default function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  // Step state: 'lookup' | 'existing' | 'new'
  const [step, setStep] = useState<'lookup' | 'existing' | 'new'>(
    initialData ? 'new' : 'lookup'
  )

  const [lookupData, setLookupData] = useState<LookupResult | null>(null)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contact: initialData?.contact || '',
    email: initialData?.email || '',
    services: initialData?.services ? JSON.parse(initialData.services) : [],
    serviceTakenBy: initialData?.serviceTakenBy
      ? typeof initialData.serviceTakenBy === 'string'
        ? initialData.serviceTakenBy.startsWith('[')
          ? JSON.parse(initialData.serviceTakenBy)
          : [initialData.serviceTakenBy]
        : initialData.serviceTakenBy
      : [],
    amount: initialData?.amount || '',
    discount: initialData?.discount || '',
    paymentType: initialData?.paymentType || 'CASH',
    notes: initialData?.notes || '',
  })

  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [serviceQuery, setServiceQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data.filter((s: Staff) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  // Handle phone lookup result
  const handlePhoneFound = (result: LookupResult) => {
    setLookupData(result)
    if (result.exists && result.customer) {
      setFormData(prev => ({
        ...prev,
        name: result.customer!.name,
        contact: result.customer!.contact,
        email: result.customer!.email || '',
        services: [],
        serviceTakenBy: [],
        amount: '',
        discount: '',
        paymentType: 'CASH',
        notes: '',
      }))
      setStep('existing')
    } else {
      setFormData(prev => ({
        ...prev,
        contact: result.phone,
        name: '',
        email: '',
        services: [],
        serviceTakenBy: [],
        amount: '',
        discount: '',
        paymentType: 'CASH',
        notes: '',
      }))
      setStep('new')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'discount') {
      const numValue = parseFloat(value)
      if (value === '' || (numValue >= 0 && numValue <= 100)) {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
      return
    }

    if (name === 'contact') {
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }))
      }
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget.type === 'number') e.currentTarget.blur()
  }

  // Smart Service & Category autocomplete filtering
  const getFilteredCategories = () => {
    const q = serviceQuery.trim().toLowerCase()
    const cleanQ = q.replace(/[^a-z0-9]/g, '')

    return SERVICE_CATEGORIES.map(cat => {
      // 1. If user clicked a specific category chip, restrict display to that category
      if (selectedCategory && cat.category !== selectedCategory) {
        return { category: cat.category, services: [] }
      }

      // 2. If no text search query is entered, display all child services
      if (!q) {
        return cat
      }

      // 3. Check if search query matches category name or category keywords
      const catKeywords = CATEGORY_KEYWORDS[cat.category] || []
      const categoryMatches =
        cat.category.toLowerCase().includes(q) ||
        cat.category.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanQ) ||
        catKeywords.some(kw => kw.includes(q) || (q.length >= 3 && kw.startsWith(q)))

      // If the category itself matches (e.g. typing "threading", "haircut", "facial", "waxing"),
      // display ALL child values in this category!
      if (categoryMatches) {
        return cat
      }

      // 4. Otherwise filter child services by exact name, normalized name, or keyword aliases
      const matchingServices = cat.services.filter(s => {
        const lowerS = s.toLowerCase()
        const cleanS = lowerS.replace(/[^a-z0-9]/g, '')

        if (lowerS.includes(q) || cleanS.includes(cleanQ)) return true

        const aliases = SERVICE_ALIASES[s] || []
        return aliases.some(alias => alias.includes(q) || q.includes(alias))
      })

      return {
        category: cat.category,
        services: matchingServices,
      }
    }).filter(cat => cat.services.length > 0)
  }

  const filteredCategories = getFilteredCategories()

  const selectService = (service: string) => {
    if (!formData.services.includes(service)) {
      setFormData(prev => ({ ...prev, services: [...prev.services, service] }))
      toast.success(`Added "${service}"`)
    } else {
      setFormData(prev => ({ ...prev, services: prev.services.filter((s: string) => s !== service) }))
      toast.success(`Removed "${service}"`)
    }
  }

  const addCustomService = () => {
    const trimmed = serviceQuery.trim()
    if (!trimmed) return
    if (formData.services.includes(trimmed)) {
      toast.error('Service already added')
      return
    }
    setFormData(prev => ({ ...prev, services: [...prev.services, trimmed] }))
    setServiceQuery('')
    setShowDropdown(false)
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanContact = normalizePhone(formData.contact)
    if (!isValidPhone(cleanContact)) {
      toast.error('Contact number must be exactly 10 digits')
      return
    }

    if (formData.services.length === 0) {
      toast.error('Please add at least one service')
      return
    }

    setLoading(true)

    try {
      const url = initialData ? `/api/customers/${initialData.id}` : '/api/customers'
      const method = initialData ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        contact: cleanContact,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(
          initialData
            ? 'Customer updated successfully!'
            : step === 'existing'
            ? "Today's visit recorded for " + formData.name + '!'
            : 'New customer added successfully!'
        )
        onSuccess()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to save customer')
      }
    } catch {
      toast.error('An error occurred while saving customer')
    } finally {
      setLoading(false)
    }
  }

  // Live calculation of monthly total including today's bill
  const prevMonthTotal = (step === 'existing' && lookupData?.currentMonthTotal) || 0
  const inputAmount = parseFloat(formData.amount) || 0
  const inputDiscount = parseFloat(formData.discount) || 0
  const todayNet = Math.max(0, inputAmount - (inputAmount * inputDiscount) / 100)
  const projectedMonthTotal = Math.round((prevMonthTotal + todayNet) * 100) / 100
  const threshold = lookupData?.rewardThreshold || 5000
  const alreadyHadReward = prevMonthTotal >= threshold
  const qualifiesWithToday = !alreadyHadReward && projectedMonthTotal >= threshold
  const stillNeeds = Math.max(0, threshold - projectedMonthTotal)

  // STEP 1: Phone Search view
  if (step === 'lookup' && !initialData) {
    return <PhoneLookupStep onFound={handlePhoneFound} onCancel={onSuccess} />
  }

  return (
    <div className="card p-6 max-w-4xl mx-auto">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData
              ? 'Edit Record'
              : step === 'existing'
              ? 'Add Visit for Existing Customer'
              : 'Register New Customer'}
          </h2>
          <p className="text-sm text-gray-500">
            {step === 'existing'
              ? 'Existing profile found. Add today\'s service to their history.'
              : 'Fill in details to register and log the first visit.'}
          </p>
        </div>

        {!initialData && (
          <button
            type="button"
            onClick={() => setStep('lookup')}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center space-x-1"
          >
            <span>← Search Another Number</span>
          </button>
        )}
      </div>

      {/* EXISTING CUSTOMER SUMMARY & REWARD CARD */}
      {step === 'existing' && lookupData && (
        <div className="mb-6 space-y-4">
          {/* Profile & Monthly Spend Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-primary-600 via-primary-700 to-amber-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md ring-2 ring-primary-200">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{formData.name}</div>
                  <div className="text-sm text-gray-600 font-mono">📱 +91 {formData.contact}</div>
                  {formData.email && (
                    <div className="text-xs text-gray-500">✉️ {formData.email}</div>
                  )}
                </div>
              </div>

              {/* Monthly Total */}
              <div className="sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {lookupData.currentMonthName} Total
                </div>
                <div className="flex items-baseline sm:justify-end space-x-2">
                  <span className="text-2xl font-extrabold text-primary-700">
                    ₹{projectedMonthTotal.toLocaleString('en-IN')}
                  </span>
                  {todayNet > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      +₹{todayNet.toLocaleString('en-IN')} today
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Reward goal: ₹{threshold.toLocaleString('en-IN')} {todayNet > 0 && `(Past: ₹${prevMonthTotal.toLocaleString('en-IN')})`}
                </div>
              </div>
            </div>
          </div>

          {/* Reward / Gift Alert */}
          {qualifiesWithToday ? (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-xl flex items-center space-x-3 shadow-md animate-pulse">
              <span className="text-3xl">🎁</span>
              <div>
                <div className="font-bold text-base uppercase tracking-wide">
                  🎉 Reward Unlocked With Today&apos;s Bill!
                </div>
                <div className="text-sm text-emerald-50 font-medium">
                  With today&apos;s bill of ₹{todayNet.toLocaleString('en-IN')}, monthly spend reaches <strong>₹{projectedMonthTotal.toLocaleString('en-IN')}</strong> (Goal: ₹{threshold.toLocaleString('en-IN')}).
                  <br />
                  <span className="underline font-semibold text-white">Please offer the monthly reward/gift to the customer now!</span>
                </div>
              </div>
            </div>
          ) : alreadyHadReward ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-xl flex items-center space-x-3 text-emerald-900 shadow-sm">
              <span className="text-3xl">🎁</span>
              <div>
                <div className="font-bold text-base text-emerald-800">
                  Monthly Spend: ₹{projectedMonthTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-emerald-700 font-medium">
                  Customer has reached the ₹{threshold.toLocaleString('en-IN')} reward goal! Please offer the monthly reward if not already given.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800 flex items-center justify-between">
              <span>
                💡 Spent ₹{prevMonthTotal.toLocaleString('en-IN')} this month
                {todayNet > 0 ? ` + ₹${todayNet.toLocaleString('en-IN')} today = ₹${projectedMonthTotal.toLocaleString('en-IN')}` : ''}
                . Needs <strong className="font-semibold text-blue-900">₹{stillNeeds.toLocaleString('en-IN')}</strong> more to earn the monthly gift reward.
              </span>
            </div>
          )}

          {/* Previous Services History */}
          {lookupData.history && lookupData.history.length > 0 && (
            <details className="group border border-gray-200 rounded-xl bg-white overflow-hidden">
              <summary className="px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700 cursor-pointer flex justify-between items-center select-none">
                <span>
                  Previous Visits & Services ({lookupData.history.length})
                </span>
                <span className="text-xs text-primary-600 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="p-4 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {lookupData.history.map((v) => (
                  <div key={v.id} className="py-2.5 flex justify-between items-start text-sm">
                    <div>
                      <div className="font-medium text-gray-800">
                        {v.services.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(v.visitDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {v.serviceTakenBy && ` • By: ${v.serviceTakenBy}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₹{v.finalAmount}</div>
                      <div className="text-xs text-gray-500">{v.paymentType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* NEW CUSTOMER NOTIFICATION */}
      {step === 'new' && !initialData && (
        <div className="mb-6 space-y-3">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center justify-between">
            <span>
              ✨ <strong>New Customer:</strong> No past record found for <strong>+91 {formData.contact}</strong>. Please enter their details.
            </span>
            <button
              type="button"
              onClick={() => setStep('lookup')}
              className="text-xs text-blue-600 underline hover:text-blue-900 ml-2"
            >
              Change Phone
            </button>
          </div>

          {todayNet >= threshold && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-xl flex items-center space-x-3 shadow-md animate-pulse">
              <span className="text-3xl">🎁</span>
              <div>
                <div className="font-bold text-base uppercase tracking-wide">
                  🎉 First-Visit Reward Unlocked!
                </div>
                <div className="text-sm text-emerald-50 font-medium">
                  With today&apos;s bill of ₹{todayNet.toLocaleString('en-IN')}, this new customer meets the ₹{threshold.toLocaleString('en-IN')} threshold. Please offer the welcome reward!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN FORM (TODAY'S VISIT / REGISTRATION) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CUSTOMER DETAILS */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-gray-100">
            <span className="text-base">👤</span>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Customer Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full name"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Contact Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-mono text-sm select-none font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  name="contact"
                  required
                  minLength={10}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className="input-field pl-12 font-mono"
                  value={formData.contact}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="customer@example.com"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: BILLING & PAYMENT */}
        <div className="bg-gradient-to-br from-amber-50/20 via-white to-gray-50 border border-gray-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-base">💳</span>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                {step === 'existing' ? "Today's Billing & Payment" : "Billing & Payment"}
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">Auto-calculates monthly total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                {step === 'existing' ? "Today's Bill Amount *" : "Bill Amount *"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium select-none text-base">₹</span>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  className={`input-field pl-8 transition-all duration-200 ${
                    qualifiesWithToday
                      ? '!border-2 !border-emerald-600 !bg-emerald-50/50 !text-emerald-950 font-bold focus:!ring-emerald-500 focus:!border-emerald-600'
                      : ''
                  }`}
                  value={formData.amount}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  placeholder="0.00"
                />
                {qualifiesWithToday && (
                  <span className="absolute right-3 top-2.5 text-lg pointer-events-none" title="Reward unlocked!">
                    🎁
                  </span>
                )}
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Discount (%)
              </label>
              <div className="flex space-x-1.5">
                <input
                  type="number"
                  name="discount"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input-field flex-1"
                  value={formData.discount}
                  onChange={handleInputChange}
                  onWheel={handleWheel}
                  placeholder="0"
                />
                <div className="flex items-center px-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-bold text-xs">
                  %
                </div>
              </div>
              {formData.discount && formData.amount && (
                <p className="text-[11px] text-gray-500 mt-1 font-medium">
                  Net: ₹{todayNet.toLocaleString('en-IN')} (Saved ₹{((inputAmount * inputDiscount) / 100).toFixed(2)})
                </p>
              )}
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Payment Method *
              </label>
              <select
                name="paymentType"
                required
                className="input-field font-medium"
                value={formData.paymentType}
                onChange={handleInputChange}
              >
                <option value="CASH">💵 Cash</option>
                <option value="UPI">📱 UPI (GPay / PhonePe / Paytm)</option>
                <option value="CARD">💳 Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {/* Live calculation hint under Amount */}
          {todayNet > 0 && (
            <div className="mt-3">
              {qualifiesWithToday && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-xs flex items-start space-x-3">
                  <span className="text-3xl">🎁</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-emerald-950 tracking-wide">
                        REWARD THRESHOLD REACHED!
                      </span>
                      <span className="bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Eligible With This Bill
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-1 font-medium">
                      {prevMonthTotal > 0 && `Previous: ₹${prevMonthTotal.toLocaleString('en-IN')} + `}Today: ₹{todayNet.toLocaleString('en-IN')} = <strong className="font-black text-emerald-950 text-sm">₹{projectedMonthTotal.toLocaleString('en-IN')}</strong> (Goal: ₹{threshold.toLocaleString('en-IN')})
                    </p>
                    <p className="text-xs font-bold text-emerald-800 mt-1.5 flex items-center space-x-1">
                      <span>👉</span>
                      <span className="underline">Please offer the monthly gift reward to the customer during this checkout!</span>
                    </p>
                  </div>
                </div>
              )}
              {!alreadyHadReward && !qualifiesWithToday && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                  <div>
                    <span>Month Total with this bill: </span>
                    <strong className="text-blue-950 font-bold">₹{projectedMonthTotal.toLocaleString('en-IN')}</strong>
                    {prevMonthTotal > 0 && (
                      <span className="text-blue-600 text-[11px] ml-1">
                        (₹{prevMonthTotal.toLocaleString('en-IN')} + ₹{todayNet.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                  <span className="text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded">
                    ₹{stillNeeds.toLocaleString('en-IN')} away from gift
                  </span>
                </div>
              )}
              {alreadyHadReward && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-1.5">
                  <span>✓</span>
                  <span>Already qualified for this month&apos;s reward! (New total with this bill: <strong>₹{projectedMonthTotal.toLocaleString('en-IN')}</strong>)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Services Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-gray-800">
              {step === 'existing' ? "Today's Service(s) *" : 'Services *'}
            </label>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {formData.services.length} service(s) selected
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2.5">
            Click any category pill below (e.g. <strong>Threading</strong>) to reveal all child services, or search keywords.
          </p>

          {/* Interactive Category Filter Pills */}
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null)
                setShowDropdown(true)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Categories ({SERVICE_CATEGORIES.length})
            </button>
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.category
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.category)
                    setShowDropdown(true)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs ring-2 ring-rose-200'
                      : 'bg-rose-50/80 text-rose-800 border border-rose-200/70 hover:bg-rose-100/70'
                  }`}
                >
                  {cat.category} ({cat.services.length})
                </button>
              )
            })}
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                value={serviceQuery}
                onChange={(e) => {
                  setServiceQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search category or service (e.g. Threading, Eyebrow, Facial, U-Cut, Keratin…)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const flat = filteredCategories.flatMap(c => c.services)
                    if (flat.length === 1) selectService(flat[0])
                    else addCustomService()
                  }
                  if (e.key === 'Escape') setShowDropdown(false)
                }}
              />
              <button
                type="button"
                onClick={addCustomService}
                disabled={!serviceQuery.trim()}
                className="btn-secondary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                title="Add as custom service"
              >
                + Add Custom
              </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto divide-y divide-gray-100"
                style={{ maxHeight: '320px' }}
              >
                {filteredCategories.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500 text-center">
                    No matching services found for &quot;{serviceQuery.trim()}&quot;. Click <strong>+ Add Custom</strong> to add it.
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <div key={cat.category} className="py-1">
                      <div className="sticky top-0 px-3.5 py-1.5 text-[11px] font-bold text-rose-800 uppercase tracking-wider bg-rose-50/90 border-b border-rose-100/80 flex items-center justify-between">
                        <span>{cat.category}</span>
                        <span className="text-[10px] text-rose-600 font-medium lowercase">
                          {cat.services.length} items
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {cat.services.map((service) => {
                          const alreadyAdded = formData.services.includes(service)
                          return (
                            <button
                              key={service}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                selectService(service)
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                alreadyAdded
                                  ? 'text-emerald-800 bg-emerald-50/70 font-semibold'
                                  : 'text-gray-800 hover:bg-rose-50/60 hover:text-rose-900'
                              }`}
                            >
                              <span>{service}</span>
                              {alreadyAdded ? (
                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                  ✓ Added (Click to remove)
                                </span>
                              ) : (
                                <span className="text-xs text-rose-600 font-semibold opacity-70 group-hover:opacity-100">
                                  + Select
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}

                {serviceQuery.trim() &&
                  !ALL_KNOWN_SERVICES.some(s => s.toLowerCase() === serviceQuery.trim().toLowerCase()) && (
                    <div className="p-2 bg-gray-50 border-t border-gray-100">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addCustomService()
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-primary-700 hover:bg-primary-100 rounded-lg font-medium"
                      >
                        + Add &quot;{serviceQuery.trim()}&quot; as custom service
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Selected Services Tags */}
          <div className="mt-3">
            {formData.services.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No services added yet for this visit.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-primary-100 text-primary-800 font-medium shadow-sm"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="ml-2 text-primary-600 hover:text-primary-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service Taken By (Staff) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Service Provided By (Optional - Multiple Staff)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50/70">
            {staff.map((member) => {
              const isSelected = formData.serviceTakenBy.includes(member.name)
              return (
                <label
                  key={member.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          serviceTakenBy: [...prev.serviceTakenBy, member.name],
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          serviceTakenBy: prev.serviceTakenBy.filter((n: string) => n !== member.name),
                        }))
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                  />
                  <div className="truncate">
                    <span className="block font-medium truncate">{member.name}</span>
                    <span className="block text-[10px] text-gray-400 font-normal truncate">{member.position}</span>
                  </div>
                </label>
              )
            })}
          </div>
          {formData.serviceTakenBy.length > 0 && (
            <p className="text-xs text-gray-600 mt-1.5">
              Assigned: <strong className="text-primary-700">{formData.serviceTakenBy.join(', ')}</strong>
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
          <textarea
            name="notes"
            rows={2}
            className="input-field"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Preferences, allergies, special requests..."
          />
        </div>

        {/* Reward Alert Before Saving */}
        {qualifiesWithToday && (
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-3.5 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-bold text-sm">Customer Qualifies For Monthly Gift Reward!</p>
                <p className="text-xs text-emerald-100">
                  Total spend with today&apos;s ₹{todayNet.toLocaleString('en-IN')} bill reaches <strong className="text-white underline">₹{projectedMonthTotal.toLocaleString('en-IN')}</strong> (Goal: ₹{threshold.toLocaleString('en-IN')}). Please hand over the monthly gift before customer leaves.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block bg-white text-emerald-800 font-bold text-xs px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
              Reward Due
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onSuccess}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.services.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Saving...'
              : initialData
              ? 'Update Record'
              : step === 'existing'
              ? 'Save Visit'
              : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  )
}
