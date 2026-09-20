import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockCustomers } from '@/lib/mockData'
import { normalizePhone, isValidPhone } from '@/lib/phone'
import { getSettings } from '@/lib/settings'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const rawPhone = searchParams.get('phone') || ''
    const normalizedPhone = normalizePhone(rawPhone)

    if (!isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit contact number' },
        { status: 400 }
      )
    }

    let records: any[] = []

    try {
      records = await prisma.customer.findMany({
        where: { contact: normalizedPhone },
        orderBy: { visitDate: 'desc' },
      })
    } catch (dbError) {
      console.warn('Database query failed in lookup, falling back to mock data:', dbError)
      records = mockCustomers.filter(c => normalizePhone(c.contact) === normalizedPhone)
    }

    const settings = getSettings()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const currentMonthName = format(now, 'MMMM yyyy')

    if (!records || records.length === 0) {
      return NextResponse.json({
        exists: false,
        phone: normalizedPhone,
        rewardThreshold: settings.monthlyRewardThreshold,
        currentMonthName,
      })
    }

    // Sort descending by date
    records.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
    const latest = records[0]

    // Calculate current month total
    let currentMonthTotal = 0
    const history = records.map(r => {
      let parsedServices: string[] = []
      try {
        parsedServices = typeof r.services === 'string' ? JSON.parse(r.services) : r.services
      } catch {
        parsedServices = [r.services]
      }

      const discountRate = r.discount || 0
      const finalAmount = r.amount - (r.amount * discountRate) / 100

      const visitDate = new Date(r.visitDate)
      if (visitDate >= monthStart && visitDate <= monthEnd) {
        currentMonthTotal += finalAmount
      }

      return {
        id: r.id,
        visitDate: r.visitDate,
        services: parsedServices,
        serviceTakenBy: r.serviceTakenBy,
        amount: r.amount,
        discount: r.discount,
        finalAmount: Math.round(finalAmount * 100) / 100,
        paymentType: r.paymentType,
        notes: r.notes,
      }
    })

    currentMonthTotal = Math.round(currentMonthTotal * 100) / 100
    const isEligibleForReward = currentMonthTotal >= settings.monthlyRewardThreshold

    return NextResponse.json({
      exists: true,
      phone: normalizedPhone,
      customer: {
        name: latest.name,
        contact: latest.contact,
        email: latest.email || '',
        photo: latest.photo || '',
      },
      history,
      currentMonthTotal,
      currentMonthName,
      rewardThreshold: settings.monthlyRewardThreshold,
      isEligibleForReward,
    })
  } catch (error) {
    console.error('Error in customer lookup:', error)
    return NextResponse.json({ error: 'Failed to look up customer' }, { status: 500 })
  }
}
