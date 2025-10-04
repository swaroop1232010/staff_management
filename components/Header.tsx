'use client'

import { useRouter } from 'next/navigation'
import Logo from './Logo'

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Logo size="md" showText={true} />
          
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Customers
            </button>
            <button
              onClick={() => router.push('/staff')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Staff
            </button>
          </nav>
          
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
  )
}
