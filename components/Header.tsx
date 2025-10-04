'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from './Logo'

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

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
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
          <Logo size="md" showText={true} />
          
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
            {user.role === 'SUPERADMIN' && (
              <button
                onClick={() => handleNavigation('/dashboard/reports')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Reports
              </button>
            )}
          </nav>
          
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              {user.role === 'SUPERADMIN' && (
                <button
                  onClick={() => handleNavigation('/dashboard/reports')}
                  className="text-left px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Reports
                </button>
              )}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-4 py-2">
                  <span className="text-sm text-gray-500">Role: </span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                    {user.role}
                  </span>
                </div>
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
    </header>
  )
}
