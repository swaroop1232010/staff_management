import { SignJWT, jwtVerify } from 'jose'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'SUPERADMIN' | 'RECEPTIONIST'
}

export const AUTH_COOKIE_NAME = 'auth_token'

const SECRET_KEY = process.env.JWT_SECRET || 'swasthik_salon_jwt_secure_key_9384729184729184'
const key = new TextEncoder().encode(SECRET_KEY)

/**
 * Sign a new JWT with user payload (valid for 7 days)
 */
export async function signJWT(payload: AuthUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

/**
 * Verify and decode an existing JWT
 */
export async function verifyJWT(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}

/**
 * Get valid credentials from secure server-side environment variables
 */
export function getSystemUsers() {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@swasthik.com'
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

  const receptionEmail = process.env.RECEPTION_EMAIL || process.env.NEXT_PUBLIC_RECEPTION_EMAIL || 'reception@swasthik.com'
  const receptionPassword = process.env.RECEPTION_PASSWORD || process.env.NEXT_PUBLIC_RECEPTION_PASSWORD || 'reception123'

  return [
    {
      id: 'admin-1',
      email: adminEmail,
      password: adminPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN' as const,
    },
    {
      id: 'reception-1',
      email: receptionEmail,
      password: receptionPassword,
      name: 'Receptionist',
      role: 'RECEPTIONIST' as const,
    },
  ]
}
