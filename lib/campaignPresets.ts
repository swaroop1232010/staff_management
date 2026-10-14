/**
 * Swasthik Salon & Boutique - Pre-Configured Campaign Offers & Future Offer Presets
 * Easily add, edit, or customize promotional offers for WhatsApp marketing campaigns.
 */

export interface CampaignOfferPreset {
  id: string
  title: string
  badge: string
  category: 'Festival' | 'Combos' | 'Facial & Skin' | 'Hair Care' | 'Bridal' | 'VIP Rewards'
  headline: string
  body: string
  callToAction: string
  suggestedSegment: 'all' | 'hair_cut' | 'hair_treatment' | 'facial' | 'nails' | 'waxing_threading' | 'bridal_makeup'
  defaultImageUrl?: string
}

export const CAMPAIGN_OFFER_PRESETS: CampaignOfferPreset[] = [
  {
    id: 'facial_dtan',
    title: 'Free D-Tan with Glow Facial',
    badge: '🎁 Free Gift',
    category: 'Facial & Skin',
    headline: 'Free Face & Neck D-Tan Pack (worth ₹400)',
    body: 'Book any Fruit, Gold, or Hydra Facial this week and get a Face & Neck D-Tan pack completely FREE!',
    callToAction: 'Reply "BOOK" or call 9110365226 to reserve your refreshing glow slot!',
    suggestedSegment: 'facial',
  },
  {
    id: 'haircut_spa',
    title: '20% OFF Hair Spa with Haircut',
    badge: '💇 20% OFF',
    category: 'Hair Care',
    headline: '20% OFF on Deep Conditioning Hair Spa',
    body: 'Give your hair fresh bounce & shine! Enjoy 20% OFF on Hair Spa when booked with any Haircut this week.',
    callToAction: 'Reply "BOOK" or call 9110365226 to reserve your chair!',
    suggestedSegment: 'hair_cut',
  },
  {
    id: 'hair_color_spa',
    title: '₹300 OFF Color-Lock / Keratin Spa',
    badge: '🎨 ₹300 OFF',
    category: 'Hair Care',
    headline: 'Flat ₹300 OFF on Color-Lock Hair Spa',
    body: 'Keep your hair rich, glossy & silky smooth! Enjoy flat ₹300 OFF on Keratin Touch-Up or Color-Lock Spa.',
    callToAction: 'Reply "BOOK" or call 9110365226 to schedule your pampering session!',
    suggestedSegment: 'hair_treatment',
  },
  {
    id: 'bridal_party_glam',
    title: 'Free Saree Draping with HD Makeup',
    badge: '💄 Bridal Special',
    category: 'Bridal',
    headline: 'Free Saree Draping & Premium Hairstyling',
    body: 'Glam up for celebrations! Book any HD, Bridal, or Party Makeup package and receive Complimentary Saree Draping & Hairstyling.',
    callToAction: 'Reply "BOOK" or call 9110365226 to reserve your celebration date!',
    suggestedSegment: 'bridal_makeup',
  },
  {
    id: 'mani_pedi_combo',
    title: '25% OFF Spa Mani + Pedi Combo',
    badge: '💅 25% OFF',
    category: 'Combos',
    headline: 'Flat 25% OFF on Luxury Mani + Pedi Combo',
    body: 'Relaxing care for your hands & feet! Get flat 25% OFF on our Signature Crystal Spa Pedicure & Manicure combo.',
    callToAction: 'Reply "BOOK" or call 9110365226 to reserve your relaxing appointment!',
    suggestedSegment: 'nails',
  },
  {
    id: 'waxing_underarms',
    title: 'Free Underarms with Full Arms + Legs Wax',
    badge: '🌿 Free Add-on',
    category: 'Combos',
    headline: 'Complimentary Underarms Waxing',
    body: 'Stay smooth & radiant! Book Full Arms + Full Legs Waxing and get Underarms waxing completely FREE this week.',
    callToAction: 'Reply "BOOK" or call 9110365226 to confirm your quick slot!',
    suggestedSegment: 'waxing_threading',
  },
  {
    id: 'vip_bill_discount',
    title: 'Flat ₹200 OFF on Bills Above ₹800',
    badge: '🌟 VIP Reward',
    category: 'VIP Rewards',
    headline: 'Flat ₹200 OFF on your Next Visit',
    body: 'Enjoy flat ₹200 OFF on your next salon bill of ₹800 and above! Valid across all hair, facial & grooming services.',
    callToAction: 'Reply "BOOK" or call 9110365226 to reserve your appointment!',
    suggestedSegment: 'all',
  },
  {
    id: 'festival_mega_offer',
    title: 'Festive Glam: Flat 20% OFF on ₹1,500+',
    badge: '🎉 Festive Special',
    category: 'Festival',
    headline: 'Festive Celebration: Flat 20% OFF on Total Bill',
    body: 'Celebrate in style! Enjoy flat 20% OFF on any total salon service bill of ₹1,500 and above this festive week.',
    callToAction: 'Reply "BOOK" or call 9110365226 to book your festive makeover!',
    suggestedSegment: 'all',
  },
  {
    id: 'hydra_glow_combo',
    title: 'Hydra Facial + Hair Spa Combo',
    badge: '✨ Luxury Combo',
    category: 'Combos',
    headline: 'Luxury Glow & Hair Spa Combo at Special Price',
    body: 'Complete head-to-toe refresh! Book Hydra Glow Facial and receive our Nourishing Hair Spa for just ₹500 extra.',
    callToAction: 'Reply "BOOK" or call 9110365226 to claim your combo slot!',
    suggestedSegment: 'facial',
  },
]
