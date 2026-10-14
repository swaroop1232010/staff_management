'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomerForm from '@/components/CustomerForm'
import Header from '@/components/Header'
import AdminCustomerList from '@/components/AdminCustomerList'
import RewardSettingsModal from '@/components/RewardSettingsModal'
import EodWhatsAppModal from '@/components/EodWhatsAppModal'
import CampaignModal from '@/components/CampaignModal'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isEodModalOpen, setIsEodModalOpen] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        if (parsedUser.role !== 'SUPERADMIN') {
          router.push('/dashboard')
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
          if (data.user.role !== 'SUPERADMIN') {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
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

  const handleNavigation = (path: string) => {
    // If in form mode, exit form mode first
    if (showForm) {
      setShowForm(false)
      setEditingCustomer(null)
    }
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onNavigate={handleNavigation} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-gray-200/70">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
                  Admin Panel
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                  Exclusive Women's Salon & Boutique
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Client directory, service analytics & automated marketing intelligence
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="flex items-center space-x-2 text-xs font-bold py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                title="Launch Service-Wise WhatsApp Marketing Campaigns"
              >
                <span>📢</span>
                <span>WhatsApp Campaigns</span>
              </button>
              
              <button
                onClick={() => setIsEodModalOpen(true)}
                className="flex items-center space-x-2 text-xs font-bold py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
                title="Send AI-powered End-of-Day report to Owner (+91 8501020553)"
              >
                <span>📱</span>
                <span>Send EOD to Owner</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center space-x-1.5 text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Configure monthly customer reward spend threshold"
              >
                <span>🎁</span>
                <span>Reward Settings</span>
              </button>

              <button
                onClick={() => router.push('/import-export')}
                className="flex items-center space-x-1.5 text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Import or Export client CSV records"
              >
                <span>⇄</span>
                <span>Import/Export</span>
              </button>

              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center space-x-2 text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl text-white bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-700 hover:to-rose-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>{showForm ? '📋' : '✨'}</span>
                <span>{showForm ? 'View Records' : 'Add New Customer'}</span>
              </button>
            </div>
          </div>

          <RewardSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />

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
