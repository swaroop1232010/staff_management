'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerForm from '@/components/CustomerForm'
import CustomerList from '@/components/CustomerList'
import Header from '@/components/Header'
import EodWhatsAppModal from '@/components/EodWhatsAppModal'
import CampaignModal from '@/components/CampaignModal'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [isEodModalOpen, setIsEodModalOpen] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        if (parsedUser.role === 'SUPERADMIN') {
          router.push('/admin')
        }
        return
      } catch {}
    }

    // Fallback to verified server session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          setUser(data.user)
          if (data.user.role === 'SUPERADMIN') {
            router.push('/admin')
          }
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const handleNavigation = (path: string) => {
    // If in form mode, exit form mode first
    if (showForm) {
      setShowForm(false)
    }
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onNavigate={handleNavigation} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-200/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
                  Customer Management
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                  Exclusive Women&apos;s Salon & Boutique
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Client appointments, visit tracking & instant WhatsApp outreach
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 sm:gap-2.5 w-full md:w-auto">
              {/* WhatsApp Campaigns - Only for Admin */}
              {user?.role === 'SUPERADMIN' && (
                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="h-10 inline-flex items-center space-x-2 text-xs font-bold px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                  title="Launch Service-Wise WhatsApp Marketing Campaigns (Admin Only)"
                >
                  <span>📢</span>
                  <span>WhatsApp Campaigns</span>
                </button>
              )}
              
              <button
                onClick={() => setIsEodModalOpen(true)}
                className="h-10 inline-flex items-center space-x-2 text-xs font-bold px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                title="Send AI-powered End-of-Day report to Owner"
              >
                <span>📱</span>
                <span>Send EOD to Owner</span>
              </button>

              <button
                onClick={() => router.push('/import-export')}
                className="h-10 inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Import or Export client CSV records"
              >
                <span>⇄</span>
                <span>Import/Export</span>
              </button>

              {/* Primary Staff Action: Add Customer Button */}
              <button
                onClick={() => setShowForm(!showForm)}
                className="h-10 inline-flex items-center justify-center space-x-2 text-xs sm:text-sm font-bold px-4 rounded-xl text-white bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-700 hover:to-pink-700 shadow-sm hover:shadow-md ring-2 ring-rose-200 transition-all cursor-pointer transform hover:-translate-y-0.5"
                title={showForm ? 'Return to Client Directory' : 'Record a new walk-in or service'}
              >
                <span className="text-sm">{showForm ? '📋' : '✨'}</span>
                <span>{showForm ? 'View Customer Records' : '+ Add New Customer'}</span>
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

      <EodWhatsAppModal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
      />

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />
    </div>
  )
}
