import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/settings'
import { verifyJWT, AUTH_COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = getSettings()
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const user = token ? await verifyJWT(token) : null

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Admin access required to modify settings' }, { status: 403 })
    }

    const body = await request.json()
    const { monthlyRewardThreshold } = body

    if (typeof monthlyRewardThreshold !== 'number' || monthlyRewardThreshold < 0) {
      return NextResponse.json(
        { error: 'Valid positive number required for monthlyRewardThreshold' },
        { status: 400 }
      )
    }

    const updated = updateSettings({ monthlyRewardThreshold })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
