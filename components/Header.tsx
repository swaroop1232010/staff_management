'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from './Logo'
import EodWhatsAppModal from './EodWhatsAppModal'
import CampaignModal from './CampaignModal'

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  onNavigate?: (path: string) => void
}

export default function Header({ user, onNavigate }: HeaderProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEodModalOpen, setIsEodModalOpen] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout error:', e)
    }
    localStorage.removeItem('user')
    router.push('/login')
    router.refresh()
  }

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      router.push(path)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Logo size="md" showText={true} user={user} onNavigate={onNavigate} />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Customers
            </button>
            <button
              onClick={() => handleNavigation('/staff')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Staff
            </button>
            {user?.role === 'SUPERADMIN' && (
              <button
                onClick={() => handleNavigation('/dashboard/reports')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Reports
              </button>
            )}
          </nav>
          
          {/* Desktop User Info & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3 px-3 py-1.5 bg-gradient-to-r from-amber-50/60 to-rose-50/60 border border-amber-200/50 rounded-2xl shadow-xs">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] tracking-wide font-bold uppercase text-amber-800">
                    {user.role === 'SUPERADMIN' ? '👑 Super Admin' : '🌸 ' + user.role}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl text-gray-600 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <span className="text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-900 rounded-lg border border-amber-200/60">
                {user.name}
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                Customers
              </button>
              <button
                onClick={() => handleNavigation('/staff')}
                className="text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                Staff
              </button>
              {user?.role === 'SUPERADMIN' && (
                <button
                  onClick={() => handleNavigation('/dashboard/reports')}
                  className="text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Reports
                </button>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsCampaignModalOpen(true)
                }}
                className="text-left px-4 py-2 text-blue-700 font-bold hover:bg-blue-50 rounded-md flex items-center gap-2"
              >
                <span>📢</span>
                <span>Service-Wise WhatsApp Campaigns</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsEodModalOpen(true)
                }}
                className="text-left px-4 py-2 text-emerald-700 font-bold hover:bg-emerald-50 rounded-md flex items-center gap-2"
              >
                <span>📱</span>
                <span>Send EOD Report to Owner</span>
              </button>
              <div className="border-t border-gray-200 pt-4 mt-4">
                {user && (
                  <div className="px-4 py-2">
                    <span className="text-sm text-gray-500">Role: </span>
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      {user.role}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      <EodWhatsAppModal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
      />

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />
    </header>
  )
}
