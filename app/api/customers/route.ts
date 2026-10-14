import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockCustomers } from '@/lib/mockData'
import { normalizePhone, isValidPhone } from '@/lib/phone'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Simple CUID generator for mock data
function generateCUID() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `cmgc${timestamp}${random}`
}

let mockCustomerId = 8 // Starting counter for new mock customers

export async function GET() {
  try {
    // Try to use real database first
    const customers = await prisma.customer.findMany({
      orderBy: { visitDate: 'desc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    // Fallback to mock data if database is not available
    return NextResponse.json(mockCustomers)
  }
}

function formatCustomerPayload(data: any) {
  if (!data || typeof data !== 'object') return null

  const name = String(data.name || data.Name || '').trim()
  if (!name) return null

  const rawPhone = data.contact !== undefined ? data.contact : (data.Contact !== undefined ? data.Contact : (data.phone || data.Phone || ''))
  const contact = normalizePhone(rawPhone)
  if (!isValidPhone(contact)) return null

  // Services
  let servicesArray: string[] = []
  const rawServices = data.services !== undefined ? data.services : data.Services
  if (Array.isArray(rawServices)) {
    servicesArray = rawServices.map((s: any) => String(s).trim()).filter(Boolean)
  } else if (typeof rawServices === 'string') {
    const str = rawServices.trim()
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str)
        servicesArray = Array.isArray(parsed) ? parsed.map((s: any) => String(s).trim()).filter(Boolean) : [String(parsed).trim()]
      } catch {
        servicesArray = [str]
      }
    } else if (str.includes(';')) {
      servicesArray = str.split(';').map(s => s.trim()).filter(Boolean)
    } else if (str.length > 0) {
      servicesArray = [str]
    }
  }
  if (servicesArray.length === 0) {
    servicesArray = ['Salon Service']
  }

  // ServiceTakenBy
  let serviceTakenByString: string | null = null
  const rawStaff = data.serviceTakenBy !== undefined ? data.serviceTakenBy : data.ServiceTakenBy
  if (rawStaff) {
    if (Array.isArray(rawStaff)) {
      serviceTakenByString = JSON.stringify(rawStaff.map(s => String(s).trim()).filter(Boolean))
    } else if (typeof rawStaff === 'string') {
      const trimmed = rawStaff.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed)
          serviceTakenByString = JSON.stringify(Array.isArray(parsed) ? parsed.map(s => String(s).trim()).filter(Boolean) : [String(parsed).trim()])
        } catch {
          serviceTakenByString = trimmed
        }
      } else if (trimmed.length > 0) {
        serviceTakenByString = JSON.stringify([trimmed])
      }
    }
  }

  // Amount & Discount
  const rawAmount = data.amount !== undefined ? data.amount : data.Amount
  const numAmount = parseFloat(String(rawAmount || '0'))
  const safeAmount = isNaN(numAmount) ? 0 : numAmount

  const rawDiscount = data.discount !== undefined ? data.discount : data.Discount
  const numDiscount = parseFloat(String(rawDiscount || '0'))
  const safeDiscount = isNaN(numDiscount) ? 0 : numDiscount

  // PaymentType
  const rawPayment = String(data.paymentType || data.PaymentType || 'CASH').trim().toUpperCase()
  const safePaymentType = ['CASH', 'UPI', 'CARD'].includes(rawPayment) ? rawPayment : 'CASH'

  // VisitDate
  const rawDate = data.visitDate || data.VisitDate
  let safeVisitDate = new Date()
  if (rawDate) {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      safeVisitDate = d
    }
  }

  const safeNotes = data.notes || data.Notes ? String(data.notes || data.Notes).trim() : null
  const safeEmail = data.email || data.Email ? String(data.email || data.Email).trim() : null

  return {
    name,
    contact,
    email: safeEmail,
    photo: data.photo || null,
    services: JSON.stringify(servicesArray),
    serviceTakenBy: serviceTakenByString,
    amount: safeAmount,
    discount: safeDiscount,
    discountType: 'percentage',
    paymentType: safePaymentType,
    visitDate: safeVisitDate,
    notes: safeNotes,
  }
}

export async function POST(request: NextRequest) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Support batch import
  if (Array.isArray(body)) {
    const formattedList = body.map(formatCustomerPayload).filter(Boolean) as any[]
    if (formattedList.length === 0) {
      return NextResponse.json({ error: 'No valid customer records found in payload' }, { status: 400 })
    }

    try {
      // Prisma createMany if supported or sequential
      const created = await Promise.all(
        formattedList.map(payload =>
          prisma.customer.create({ data: payload })
        )
      )
      return NextResponse.json({ success: true, count: created.length })
    } catch {
      // Mock data fallback
      const newMockList = formattedList.map(payload => ({
        id: generateCUID(),
        ...payload,
        email: payload.email || '',
        photo: null,
        notes: payload.notes || '',
        serviceTakenBy: payload.serviceTakenBy || '',
        visitDate: payload.visitDate.toISOString(),
        createdAt: payload.visitDate.toISOString(),
        updatedAt: new Date().toISOString(),
      })) as any[]
      mockCustomers.unshift(...newMockList)
      return NextResponse.json({ success: true, count: newMockList.length, mock: true })
    }
  }
  

  // Single customer
  const payload = formatCustomerPayload(body)
  if (!payload) {
    return NextResponse.json({ 
      error: 'Invalid customer record: name, valid 10-digit contact, amount, and paymentType are required' 
    }, { status: 400 })
  }

  try {
    const customer = await prisma.customer.create({
      data: payload,
    })
    return NextResponse.json(customer)
  } catch (error) {
    const newCustomer = {
      id: generateCUID(),
      ...payload,
      email: payload.email || '',
      photo: null,
      notes: payload.notes || '',
      serviceTakenBy: payload.serviceTakenBy || '',
      visitDate: payload.visitDate.toISOString(),
      createdAt: payload.visitDate.toISOString(),
      updatedAt: new Date().toISOString(),
    } as any
    mockCustomers.unshift(newCustomer)
    return NextResponse.json(newCustomer)
  }
}
