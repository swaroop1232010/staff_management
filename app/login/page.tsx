'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store display user profile for client headers
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Login successful!')

        if (data.user.role === 'SUPERADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      } else {
        toast.error(data.error || 'Invalid credentials')
      }
    } catch {
      toast.error('Login failed. Please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">Sign in to your account</h3>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field mt-1"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field mt-1"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-2">
            <div className="font-semibold text-gray-700">Quick Fill / Demo Logins:</div>
            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200">
              <div>
                <span className="font-medium text-gray-700">Receptionist:</span> reception@swasthik.com (pass: reception123)
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('reception@swasthik.com')
                  setPassword('reception123')
                }}
                className="text-primary-600 hover:text-primary-800 font-medium ml-2 underline"
              >
                Fill
              </button>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200">
              <div>
                <span className="font-medium text-gray-700">Admin:</span> admin@swasthik.com (pass: admin123)
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@swasthik.com')
                  setPassword('admin123')
                }}
                className="text-primary-600 hover:text-primary-800 font-medium ml-2 underline"
              >
                Fill
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
