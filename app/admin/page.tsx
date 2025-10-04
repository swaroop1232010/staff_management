'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerForm from '@/components/CustomerForm'
import CustomerList from '@/components/CustomerList'
import Header from '@/components/Header'
import AdminCustomerList from '@/components/AdminCustomerList'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Redirect non-admin users
      if (parsedUser.role !== 'SUPERADMIN') {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/import-export')}
                className="btn-secondary"
              >
                Import/Export
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
              >
                {showForm ? 'View Customers' : 'Add New Customer'}
              </button>
            </div>
          </div>

          {showForm ? (
            <CustomerForm 
              onSuccess={handleFormSuccess}
              initialData={editingCustomer}
            />
          ) : (
            <AdminCustomerList onEdit={handleEditCustomer} />
          )}
        </div>
      </main>
    </div>
  )
}
