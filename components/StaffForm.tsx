'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffFormProps {
  initialData?: Staff;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StaffForm({ initialData, onSuccess, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || '',
        position: initialData.position,
        isActive: initialData.isActive
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = initialData ? `/api/staff/${initialData.id}` : '/api/staff';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff member');
      }

      toast.success(initialData ? 'Staff member updated successfully!' : 'Staff member created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error saving staff member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="card p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-gray-100">
        <span className="text-2xl">👥</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <p className="text-xs text-gray-500">Salon team member profile and role</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g. Priya Mehta"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="position" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Position / Role *
            </label>
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select role</option>
              <option value="Senior Stylist">Senior Stylist</option>
              <option value="Stylist">Stylist</option>
              <option value="Skin Specialist">Skin Specialist</option>
              <option value="Makeup Artist">Makeup Artist</option>
              <option value="Nail Artist">Nail Artist</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Manager">Manager</option>
              <option value="Assistant">Assistant</option>
              <option value="Trainee">Trainee</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field font-mono"
              placeholder="10-digit number"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Email Address (Optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            placeholder="staff@swasthik.com"
          />
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-800 block">Active Status</span>
            <span className="text-xs text-gray-500">Enable to assign to new client appointments</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Staff' : 'Add Staff Member')}
          </button>
        </div>
      </form>
    </div>
  );
}
