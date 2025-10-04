import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  user?: {
    role: string
  }
  onNavigate?: (path: string) => void
}

export default function Logo({ size = 'md', showText = true, user, onNavigate }: LogoProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    if (user?.role === 'SUPERADMIN') {
      const path = '/dashboard/reports'
      if (onNavigate) {
        onNavigate(path)
      } else {
        router.push(path)
      }
    } else {
      const path = '/dashboard'
      if (onNavigate) {
        onNavigate(path)
      } else {
        router.push(path)
      }
    }
  }
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }

  const imageSizes = {
    sm: 32,
    md: 48,
    lg: 64
  }

  return (
    <button 
      onClick={handleLogoClick}
      className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
    >
      {/* Logo image */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/logo.png"
          alt="Swasthik Logo"
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-contain w-full h-full"
          priority
        />
      </div>
      
      {showText && (
        <div className="flex flex-col items-center">
          <h1 className={`${textSizes[size]} font-serif font-bold text-gray-900`}>
            SWASTHIK
          </h1>
          <div className={`w-full h-0.5 my-1 bg-gradient-to-r from-transparent via-black to-transparent`}></div>
          <p className={`${taglineSizes[size]} text-gray-600 font-sans`}>
            UNISEX SALON & ACADEMY
          </p>
        </div>
      )}
    </button>
  )
}
