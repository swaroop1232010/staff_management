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
      // Use environment variables for credentials (no fallbacks for security)
      const validCredentials = [
        { 
          email: process.env.NEXT_PUBLIC_ADMIN_EMAIL, 
          password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD, 
          role: 'SUPERADMIN', 
          name: 'Super Admin' 
        },
        { 
          email: process.env.NEXT_PUBLIC_RECEPTION_EMAIL, 
          password: process.env.NEXT_PUBLIC_RECEPTION_PASSWORD, 
          role: 'RECEPTIONIST', 
          name: 'Receptionist' 
        }
      ].filter(cred => cred.email && cred.password) // Only include valid credentials

      const user = validCredentials.find(
        cred => cred.email === email && cred.password === password
      )

      if (user) {
        const { password: _, ...userWithoutPassword } = user
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        toast.success('Login successful!')
        
        if (user.role === 'SUPERADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
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
        </form>
      </div>
    </div>
  )
}
