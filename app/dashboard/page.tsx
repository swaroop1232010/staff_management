'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerForm from '@/components/CustomerForm'
import CustomerList from '@/components/CustomerList'
import Header from '@/components/Header'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // Redirect superadmin to admin panel
      if (parsedUser.role === 'SUPERADMIN') {
        router.push('/admin')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
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
            <CustomerForm onSuccess={() => setShowForm(false)} />
          ) : (
            <CustomerList />
          )}
        </div>
      </main>
    </div>
  )
}
