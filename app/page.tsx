'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Logo size="lg" showText={true} />
          </div>
          <p className="text-xl text-gray-700 mb-8">Customer Management System</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary px-8 py-3 text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
          <Logo size="md" showText={true} />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Swasthik Customer Management
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Manage your salon customers efficiently and professionally
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Management</h3>
                <p className="text-gray-600 mb-4">
                  {user.role === 'SUPERADMIN' 
                    ? 'Full CRUD operations for customer data management'
                    : 'Add new customers and view existing records'
                  }
                </p>
                <button
                  onClick={() => router.push(user.role === 'SUPERADMIN' ? '/admin' : '/dashboard')}
                  className="btn-primary w-full"
                >
                  {user.role === 'SUPERADMIN' ? 'Admin Panel' : 'Customer Dashboard'}
                </button>
              </div>
              
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <p className="text-gray-600 mb-4">
                  Import/Export data, manage photos, and track customer visits
                </p>
                <button
                  onClick={() => router.push('/import-export')}
                  className="btn-secondary w-full"
                >
                  Import/Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
