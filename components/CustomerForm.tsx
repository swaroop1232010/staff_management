'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import PhotoUpload from './PhotoUpload'

interface Staff {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
}

interface CustomerFormProps {
  onSuccess: () => void
  initialData?: any
}

const SERVICE_CATEGORIES = [
  { category: 'Threading', services: ['Eyebrow','Upper Lip','Forehead','Chin','Full Face','Side Locks','Neck'] },
  { category: 'Hair Services', services: ['Basic Hair Cut','U-Cut','V-Cut','Step Cut','Layer Cut','Feather Cut','Butterfly Cut','Bob Cut','Blunt Cut','Front Layers','Curtain Bangs','Hair Trim','Kids Hair Cut','Hair Wash','Blow Dry'] },
  { category: 'Hair Colour', services: ['Global Hair Colour','Root Touch-Up','Grey Hair Coverage','Global Black Colour','Fashion Hair Colour','Highlights','Lowlights','Balayage','Ombre','Streaks','Front Hair Colour','Underlayer Hair Colour','Colour Correction'] },
  { category: 'Facial Service', services: ['Clean-up','Fruit Facial','Gold Facial','Wine Facial','Glow Facial','Whitening Facial','Instant Facial','D-Tan Facial','Herbal Facial','Daimond Facial','Pearl Facial','Luxury Gold Facial','O3 Facial','Sea Saw Facial','Chocolate Facial','Radiant Facial','Bridal Facial','Acne/Anti-Pimple Facial','Hydrating Facial','Hydra Facial','Pigmentation Facial'] },
  { category: 'PMU (Permanent Make-Up)', services: ['Microblading – Eyebrow Enhancement','Ombre/Powder Brows','Combination Brows','Lip Blush','Lip Neutralization','Eyeliner / Lash Line Enhancement','Beauty Mark / Mole Enhancement','PMU Colour Correction / Touch-Up','Annual/Follow-up Touch-Up'] },
  { category: 'Hair Treatments', services: ['Hair Spa','Keratin Treatment','Smoothening','Hair Straightening','Hair Botox','Cysteine Treatment','Protein Treatment','Hair Fall Treatment','Anti-Dandruff Treatment','Scalp Treatment','Dry & Damaged Hair Treatment','Frizzy Hair Treatment','Split-End Treatment','Deep Conditioning','Hair Detox Treatment'] },
  { category: 'Manicure Services', services: ['Basic Manicure','Spa Manicure','Charcoal Manicure','Crystal Manicure','Ice Cream Manicure','Nail Shaping & Buffing','Cuticle Care','Hand Scrub & Polish','Hand Massage'] },
  { category: 'Pedicure Services', services: ['Basic Pedicure','Spa Pedicure','Crystal Pedicure','Ice Cream Pedicure','Charcoal Pedicure','Foot Scrub','Cuticle & Nail Care','Heel Care','Foot Massage','Dead Skin Removal'] },
  { category: 'Waxing', services: ['Full Arms Wax','Half Arms Wax','Underarms Wax','Full Legs Wax','Half Legs Wax','Full Body Wax','Back Wax','Front Body Wax','Stomach Wax','Bikini Line Wax','Face Wax','Hand Wax','Foot Wax'] },
  { category: 'D-Tan Packs', services: ['Face D-Tan','Face & Neck D-Tan','Hands D-Tan','Legs D-Tan','Back D-Tan','Neck D-Tan','Full Body D-Tan'] },
  { category: 'Packs', services: ['Peel-Off Mask','Sheet Mask','Clay Mask','Charcoal Mask','Gold Mask','Collagen Mask','Gel Mask','Aloe Vera Mask','Hydrating Mask','Brightening Mask','De-Tan Mask','Anti-Pimple Mask','Cooling & Soothing Mask','Rubber Mask / Alginate Mask'] },
  { category: 'Nail Extensions', services: ['Basic Nail Polish','French Nail Polish','Gel Polish','Gel Polish Removal','Nail Shaping & Buffing','Nail Art','Glitter Nail Polish','Chrome Nail Finish','Matte Nail Finish','Nail Extension','Nail Extension Removal'] },
  { category: 'Make-Up', services: ['Basic Makeup','Party Makeup','Engagement Makeup','Reception Makeup','Bridal Makeup','HD Makeup','Airbrush Makeup','Sangeet Makeup','Baby Shower / Maternity Makeup','Photoshoot Makeup','Saree Draping','Hairstyling','Makeup + Hairstyle Combo','Bridal Makeup + Hairstyle + Saree Draping'] },
]

const ALL_KNOWN_SERVICES = SERVICE_CATEGORIES.flatMap(c => c.services)

export default function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contact: initialData?.contact || '',
    email: initialData?.email || '',
    photo: initialData?.photo || '',
    services: initialData?.services ? JSON.parse(initialData.services) : [],
    serviceTakenBy: initialData?.serviceTakenBy
      ? (typeof initialData.serviceTakenBy === 'string'
          ? (initialData.serviceTakenBy.startsWith('[') ? JSON.parse(initialData.serviceTakenBy) : [initialData.serviceTakenBy])
          : initialData.serviceTakenBy)
      : [],
    amount: initialData?.amount || '',
    discount: initialData?.discount || '',
    paymentType: initialData?.paymentType || 'CASH',
    notes: initialData?.notes || '',
  })

  const [loading, setLoading] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [serviceQuery, setServiceQuery] = useState('')
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

  const getFilteredCategories = () => {
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return SERVICE_CATEGORIES
    return SERVICE_CATEGORIES
      .map(cat => ({ category: cat.category, services: cat.services.filter(s => s.toLowerCase().includes(q)) }))
      .filter(cat => cat.services.length > 0)
  }

  const filteredCategories = getFilteredCategories()

  const selectService = (service: string) => {
    if (!formData.services.includes(service)) {
      setFormData(prev => ({ ...prev, services: [...prev.services, service] }))
    }
    setServiceQuery('')
    setShowDropdown(false)
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
    setFormData(prev => ({ ...prev, services: prev.services.filter((_: any, i: number) => i !== index) }))
  }

  const handlePhotoSelect = (photoUrl: string) => {
    setFormData(prev => ({ ...prev, photo: photoUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.contact.length !== 10) {
      toast.error('Contact number must be exactly 10 digits')
      return
    }
    setLoading(true)
    try {
      const url = initialData ? `/api/customers/${initialData.id}` : '/api/customers'
      const method = initialData ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (response.ok) {
        toast.success(initialData ? 'Customer updated successfully!' : 'Customer added successfully!')
        onSuccess()
      } else {
        const errorText = await response.text()
        let errorMessage = 'Failed to save customer'
        try { const d = JSON.parse(errorText); if (d.error) errorMessage = d.error } catch { if (errorText) errorMessage = errorText }
        toast.error(errorMessage)
      }
    } catch { toast.error('An error occurred while saving customer') }
    finally { setLoading(false) }
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{initialData ? 'Edit Customer' : 'Add New Customer'}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
            <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleInputChange} placeholder="Enter customer name" />
          </div>

          <div>
            <PhotoUpload onPhotoSelect={handlePhotoSelect} currentPhoto={formData.photo} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
            <input
              type="tel" name="contact" required minLength={10} maxLength={10} pattern="[0-9]{10}"
              className="input-field" value={formData.contact} onChange={handleInputChange} onWheel={handleWheel}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
                if (formData.contact.length >= 10 && !['Backspace','Delete'].includes(e.key)) e.preventDefault()
              }}
              placeholder="Enter 10-digit contact number"
            />
            {formData.contact && formData.contact.length < 10 && <div className="text-xs text-red-500 mt-1">Contact number must be exactly 10 digits</div>}
            {formData.contact && formData.contact.length === 10 && <div className="text-xs text-green-500 mt-1">✓ Valid contact number</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
            <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
            <select name="paymentType" required className="input-field" value={formData.paymentType} onChange={handleInputChange}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input type="number" name="amount" required step="0.01" min="0" className="input-field" value={formData.amount} onChange={handleInputChange} onWheel={handleWheel} placeholder="Enter amount" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
            <div className="flex space-x-2">
              <input type="number" name="discount" step="0.01" min="0" max="100" className="input-field flex-1" value={formData.discount} onChange={handleInputChange} onWheel={handleWheel} placeholder="Enter discount percentage (0-100)" />
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">%</div>
            </div>
            {formData.discount && formData.amount && (
              <div className="text-xs text-gray-500 mt-1">
                Discount: Rs.{(parseFloat(formData.amount) * parseFloat(formData.discount) / 100).toFixed(2)} | Final Amount: Rs.{(parseFloat(formData.amount) - (parseFloat(formData.amount) * parseFloat(formData.discount) / 100)).toFixed(2)}
              </div>
            )}
            {formData.discount && parseFloat(formData.discount) > 100 && <div className="text-xs text-red-500 mt-1">Discount cannot exceed 100%</div>}
          </div>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Services *</label>
          <p className="text-xs text-gray-500 mb-2">
            Search and pick from the categorised list, or type a custom name and click <strong>+ Add Custom</strong>.
          </p>

          <div className="relative" ref={dropdownRef}>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                value={serviceQuery}
                onChange={(e) => { setServiceQuery(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search (e.g. Eyebrow, Keratin, Bridal…)"
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
                title="Add as a custom service not in the predefined list"
              >
                + Add Custom
              </button>
            </div>

            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto" style={{ maxHeight: '300px' }}>
                {filteredCategories.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No matching services. Use <strong>+ Add Custom</strong> to add it.
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <div key={cat.category}>
                      <div className="sticky top-0 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        {cat.category}
                      </div>
                      {cat.services.map((service) => {
                        const alreadyAdded = formData.services.includes(service)
                        return (
                          <button
                            key={service}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectService(service) }}
                            disabled={alreadyAdded}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${alreadyAdded ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-800 hover:bg-primary-50 hover:text-primary-800 cursor-pointer'}`}
                          >
                            {alreadyAdded ? ('check ' + service) : service}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}

                {serviceQuery.trim() && !ALL_KNOWN_SERVICES.some(s => s.toLowerCase() === serviceQuery.trim().toLowerCase()) && (
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); addCustomService() }}
                      className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                    >
                      + Add custom service: "{serviceQuery.trim()}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            {formData.services.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No services selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    {service}
                    <button type="button" onClick={() => removeService(index)} className="ml-2 text-primary-600 hover:text-primary-800 leading-none">x</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Service Taken By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Taken By (Optional - Multiple Selection)</label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
            {staff.map((member) => (
              <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.serviceTakenBy.includes(member.name)}
                  onChange={(e) => {
                    if (e.target.checked) setFormData(prev => ({ ...prev, serviceTakenBy: [...prev.serviceTakenBy, member.name] }))
                    else setFormData(prev => ({ ...prev, serviceTakenBy: prev.serviceTakenBy.filter((n: string) => n !== member.name) }))
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{member.name} - {member.position}</span>
              </label>
            ))}
          </div>
          {formData.serviceTakenBy.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Selected: </span>
              <span className="text-sm font-medium text-primary-600">{formData.serviceTakenBy.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
          <textarea name="notes" rows={3} className="input-field" value={formData.notes} onChange={handleInputChange} placeholder="Enter any additional notes" />
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onSuccess} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading || formData.services.length === 0} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : (initialData ? 'Update Customer' : 'Add Customer')}
          </button>
        </div>
      </form>
    </div>
  )
}
