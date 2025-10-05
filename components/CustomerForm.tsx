'use client'

import { useState, useEffect } from 'react'
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

export default function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    contact: initialData?.contact || '',
    email: initialData?.email || '',
    photo: initialData?.photo || '',
    services: initialData?.services ? JSON.parse(initialData.services) : [],
    serviceTakenBy: initialData?.serviceTakenBy ? 
      (typeof initialData.serviceTakenBy === 'string' ? 
        (initialData.serviceTakenBy.startsWith('[') ? JSON.parse(initialData.serviceTakenBy) : [initialData.serviceTakenBy]) : 
        initialData.serviceTakenBy) : [],
    amount: initialData?.amount || '',
    discount: initialData?.discount || '',
    paymentType: initialData?.paymentType || 'CASH',
    notes: initialData?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [newService, setNewService] = useState('')
  const [staff, setStaff] = useState<Staff[]>([])

  useEffect(() => {
    fetchStaff()
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
    
    // Validate discount percentage (0-100)
    if (name === 'discount') {
      const numValue = parseFloat(value)
      if (value === '' || (numValue >= 0 && numValue <= 100)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }
    
    // Validate contact number (exactly 10 digits)
    if (name === 'contact') {
      // Remove any non-digit characters
      const digitsOnly = value.replace(/\D/g, '')
      // Only allow up to 10 digits
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: digitsOnly
        }))
      }
      // Prevent any input beyond 10 digits
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Prevent scrolling on number inputs
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (e.currentTarget.type === 'number') {
      e.currentTarget.blur()
    }
  }

  const addService = () => {
    if (newService.trim()) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }))
      setNewService('')
    }
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_: any, i: number) => i !== index)
    }))
  }

  const handlePhotoSelect = (photoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      photo: photoUrl
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate contact number length
    if (formData.contact.length !== 10) {
      toast.error('Contact number must be exactly 10 digits')
      return
    }
    
    setLoading(true)

    try {
      const url = initialData ? `/api/customers/${initialData.id}` : '/api/customers'
      const method = initialData ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success(initialData ? 'Customer updated successfully!' : 'Customer added successfully!')
        onSuccess()
      } else {
        const errorText = await response.text()
        
        let errorMessage = 'Failed to save customer'
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If errorText is not JSON, use the text as is
          if (errorText) {
            errorMessage = errorText
          }
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error('An error occurred while saving customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {initialData ? 'Edit Customer' : 'Add New Customer'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="input-field"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <PhotoUpload 
              onPhotoSelect={handlePhotoSelect}
              currentPhoto={formData.photo}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number *
            </label>
            <input
              type="tel"
              name="contact"
              required
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              className="input-field"
              value={formData.contact}
              onChange={handleInputChange}
              onWheel={handleWheel}
              onKeyDown={(e) => {
                // Prevent non-digit keys except backspace, delete, tab, escape, enter
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                  e.preventDefault()
                }
                // Prevent input if already 10 digits (except for backspace/delete)
                if (formData.contact.length >= 10 && !['Backspace', 'Delete'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              placeholder="Enter 10-digit contact number"
            />
            {formData.contact && formData.contact.length < 10 && (
              <div className="text-xs text-red-500 mt-1">
                Contact number must be exactly 10 digits
              </div>
            )}
            {formData.contact && formData.contact.length === 10 && (
              <div className="text-xs text-green-500 mt-1">
                ✓ Valid contact number
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type *
            </label>
            <select
              name="paymentType"
              required
              className="input-field"
              value={formData.paymentType}
              onChange={handleInputChange}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              required
              step="0.01"
              min="0"
              className="input-field"
              value={formData.amount}
              onChange={handleInputChange}
              onWheel={handleWheel}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount
            </label>
            <div className="flex space-x-2">
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
                placeholder="Enter discount percentage (0-100)"
              />
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-medium">
                %
              </div>
            </div>
            {formData.discount && formData.amount && (
              <div className="text-xs text-gray-500 mt-1">
                Discount: ₹{(parseFloat(formData.amount) * parseFloat(formData.discount) / 100).toFixed(2)} | 
                Final Amount: ₹{(parseFloat(formData.amount) - (parseFloat(formData.amount) * parseFloat(formData.discount) / 100)).toFixed(2)}
              </div>
            )}
            {formData.discount && parseFloat(formData.discount) > 100 && (
              <div className="text-xs text-red-500 mt-1">
                Discount cannot exceed 100%
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services *
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              className="input-field flex-1"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Enter service name"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            />
            <button
              type="button"
              onClick={addService}
              className="btn-secondary"
            >
              Add Service
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {service}
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Taken By (Optional - Multiple Selection)
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
            {staff.map((member) => (
              <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.serviceTakenBy.includes(member.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        serviceTakenBy: [...prev.serviceTakenBy, member.name]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        serviceTakenBy: prev.serviceTakenBy.filter((name: string) => name !== member.name)
                      }))
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  {member.name} - {member.position}
                </span>
              </label>
            ))}
          </div>
          {formData.serviceTakenBy.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-600">Selected: </span>
              <span className="text-sm font-medium text-primary-600">
                {formData.serviceTakenBy.join(', ')}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            rows={3}
            className="input-field"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Enter any additional notes"
          />
        </div>

        <div className="flex justify-end space-x-4">
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
            {loading ? 'Saving...' : (initialData ? 'Update Customer' : 'Add Customer')}
          </button>
        </div>
      </form>
    </div>
  )
}
