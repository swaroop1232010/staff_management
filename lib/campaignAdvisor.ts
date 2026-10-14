import { SALON_CONFIG } from './salonConfig'

/**
 * Salon Service-Wise Targeted WhatsApp Campaign Advisor
 * Automatically classifies customer history into service categories
 * and generates personalized, high-converting WhatsApp marketing messages.
 */

export type ServiceSegmentType =
  | 'hair_cut'
  | 'hair_treatment'
  | 'facial'
  | 'nails'
  | 'waxing_threading'
  | 'bridal_makeup'
  | 'general'

export interface SegmentInfo {
  id: ServiceSegmentType
  label: string
  icon: string
  color: string
  description: string
  defaultOfferTitle: string
}

export const SEGMENT_DEFINITIONS: Record<ServiceSegmentType, SegmentInfo> = {
  hair_cut: {
    id: 'hair_cut',
    label: 'Hair Cut & Styling',
    icon: '💇',
    color: '#0284c7',
    description: 'Clients who took Haircuts, Layers, Styling, or Blow Dry',
    defaultOfferTitle: '20% OFF on Hair Spa with next Haircut',
  },
  hair_treatment: {
    id: 'hair_treatment',
    label: 'Hair Spa & Colour Care',
    icon: '🎨',
    color: '#7c3aed',
    description: 'Clients who took Colour, Highlights, Spa, Keratin, or Botox',
    defaultOfferTitle: 'Rs. 300 OFF on Color-Lock Spa or Treatment Touch-Up',
  },
  facial: {
    id: 'facial',
    label: 'Facial & Glow Care',
    icon: '✨',
    color: '#ea580c',
    description: 'Clients who took Fruit, Hydra, Gold, or Clean-up facials',
    defaultOfferTitle: 'Free Face D-Tan (worth Rs. 400) with any Glow Facial',
  },
  nails: {
    id: 'nails',
    label: 'Mani & Pedi Care',
    icon: '💅',
    color: '#db2777',
    description: 'Clients who took Manicures or Pedicures',
    defaultOfferTitle: 'Flat 25% OFF on Luxury Spa Mani-Pedi Combo',
  },
  waxing_threading: {
    id: 'waxing_threading',
    label: 'Waxing & Threading',
    icon: '🌿',
    color: '#059669',
    description: 'Clients who took Full Body, Arms/Legs Wax, or Threading',
    defaultOfferTitle: 'Complimentary Underarms with Full Arms + Legs Wax',
  },
  bridal_makeup: {
    id: 'bridal_makeup',
    label: 'Bridal & Make-Up / PMU',
    icon: '💄',
    color: '#e11d48',
    description: 'Clients who booked Bridal Makeup, Party Makeup, Saree Draping or PMU',
    defaultOfferTitle: 'Free Saree Draping & Hair Touch-Up with HD Party Makeup',
  },
  general: {
    id: 'general',
    label: 'All Active Clients',
    icon: '🌟',
    color: '#0d9488',
    description: 'General seasonal VIP reward voucher for all salon clients',
    defaultOfferTitle: 'Flat Rs. 200 OFF on any salon service above Rs. 800',
  },
}

export interface SegmentedCustomer {
  id: string
  name: string
  firstName: string
  contact: string
  services: string[]
  primaryCategory: ServiceSegmentType
  categoryLabel: string
  lastVisitDate?: string
  totalSpent?: number
  personalizedMessage: string
}

/**
 * Detects the dominant service category for a customer based on past visit services
 */
export function detectPrimaryCategory(services: string[]): ServiceSegmentType {
  const lowerServices = services.map((s) => s.toLowerCase().trim())
  const has = (keyword: string) => lowerServices.some((s) => s.includes(keyword))

  // Priority 1: Bridal, Make-Up & PMU
  if (
    has('bridal') ||
    has('makeup') ||
    has('make-up') ||
    has('pmu') ||
    has('microblading') ||
    has('lip blush') ||
    has('saree') ||
    has('draping')
  ) {
    return 'bridal_makeup'
  }

  // Priority 2: High-ticket Hair Treatments & Hair Colour
  if (
    has('colour') ||
    has('color') ||
    has('keratin') ||
    has('botox') ||
    has('smoothening') ||
    has('straightening') ||
    has('hair spa') ||
    has('highlights') ||
    has('balayage')
  ) {
    return 'hair_treatment'
  }

  // Priority 3: Facial & Skincare
  if (has('facial') || has('clean-up') || has('d-tan') || has('glow') || has('hydra')) {
    return 'facial'
  }

  // Priority 4: Nails (Manicure / Pedicure / Nail Art)
  if (has('manicure') || has('pedicure') || has('mani') || has('pedi') || has('nail')) {
    return 'nails'
  }

  // Priority 5: Waxing & Threading
  if (has('wax') || has('waxing') || has('eyebrow') || has('threading') || has('upper lip')) {
    return 'waxing_threading'
  }

  // Priority 6: Standard Haircut & Styling
  if (has('hair') || has('cut') || has('styling') || has('blow dry') || has('layer') || has('bangs')) {
    return 'hair_cut'
  }

  return 'general'
}

export const DEFAULT_CAMPAIGN_OFFER_TEXT = `✨ *Special Beauty Combos at Swasthik Salon & Boutique!* ✨

Pamper yourself with amazing beauty combos starting from just ₹99 to ₹999! ❤️

Threading, waxing, facials, manicure, pedicure & much more — choose your favourite combo according to your budget!

💖 Visit us and treat yourself to the beauty you deserve!

📍 14th Cross Road, Ravindra Nagar, Near DMart, Magunta Layout, Nellore.

👉 *Visit our Instagram:*
${SALON_CONFIG.instagramUrl}

👉 Reply *"BOOK"* or call 9110365226 to reserve your slot!`

/**
 * Generates tailored WhatsApp marketing copy for a customer
 */
export function buildTargetedMessage(
  name: string,
  category: ServiceSegmentType,
  customOfferText?: string
): string {
  const firstName = name.trim().split(' ')[0] || 'Friend'
  const messageBody = customOfferText && customOfferText.trim().length > 0
    ? customOfferText.trim()
    : DEFAULT_CAMPAIGN_OFFER_TEXT

  const hasFooter = messageBody.includes('📍') || messageBody.includes('Ravindra Nagar') || messageBody.includes('9110365226')
  if (hasFooter) {
    return `Hi ${firstName} 👋\n\n${messageBody}`
  }

  const salonFooter = `📍 *${SALON_CONFIG.brandName}*\n${SALON_CONFIG.addressShort}\n👉 *Visit our Instagram:* ${SALON_CONFIG.instagramUrl}\n👉 Reply *"BOOK"* or call 9110365226 to reserve your slot!`
  return `Hi ${firstName} 👋\n\n${messageBody}\n\n${salonFooter}`
}

/**
 * Segments an array of raw customer records into service-based campaign groups
 */
export function segmentCustomers(rawCustomers: any[]): {
  allSegmented: SegmentedCustomer[]
  segments: Record<ServiceSegmentType, SegmentedCustomer[]>
  summary: Record<ServiceSegmentType, number>
} {
  const allSegmented: SegmentedCustomer[] = []
  const segments: Record<ServiceSegmentType, SegmentedCustomer[]> = {
    hair_cut: [],
    hair_treatment: [],
    facial: [],
    nails: [],
    waxing_threading: [],
    bridal_makeup: [],
    general: [],
  }

  const summary: Record<ServiceSegmentType, number> = {
    hair_cut: 0,
    hair_treatment: 0,
    facial: 0,
    nails: 0,
    waxing_threading: 0,
    bridal_makeup: 0,
    general: 0,
  }

  rawCustomers.forEach((c) => {
    let servicesList: string[] = []
    try {
      if (typeof c.services === 'string') {
        servicesList = c.services.startsWith('[') ? JSON.parse(c.services) : [c.services]
      } else if (Array.isArray(c.services)) {
        servicesList = c.services
      }
    } catch {
      servicesList = []
    }

    const primaryCategory = detectPrimaryCategory(servicesList)
    const categoryInfo = SEGMENT_DEFINITIONS[primaryCategory] || SEGMENT_DEFINITIONS.general
    const message = buildTargetedMessage(c.name || 'Guest', primaryCategory)

    const customerObj: SegmentedCustomer = {
      id: c.id,
      name: c.name || 'Valued Guest',
      firstName: (c.name || 'Guest').split(' ')[0],
      contact: c.contact || '',
      services: servicesList,
      primaryCategory,
      categoryLabel: categoryInfo.label,
      lastVisitDate: c.visitDate || c.createdAt,
      totalSpent: Number(c.amount) || 0,
      personalizedMessage: message,
    }

    allSegmented.push(customerObj)
    segments[primaryCategory].push(customerObj)
    summary[primaryCategory]++
  })

  return {
    allSegmented,
    segments,
    summary,
  }
}
