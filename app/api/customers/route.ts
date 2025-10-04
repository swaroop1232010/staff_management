import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockCustomers } from '@/lib/mockData'

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

export async function POST(request: NextRequest) {
  let data
  try {
    data = await request.json()
  } catch (parseError) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    // Try to use real database first
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        contact: data.contact,
        email: data.email || null,
        photo: data.photo || null,
        services: JSON.stringify(data.services),
        serviceTakenBy: data.serviceTakenBy || null,
        amount: parseFloat(data.amount),
        discount: parseFloat(data.discount) || 0,
        paymentType: data.paymentType,
        notes: data.notes || null,
      },
    })
    
    return NextResponse.json(customer)
  } catch (error) {
    // Fallback to mock data if database is not available
    const newCustomer = {
      id: generateCUID(),
      name: data.name,
      contact: data.contact,
      email: data.email || null,
      photo: data.photo || null,
      services: JSON.stringify(data.services),
      serviceTakenBy: data.serviceTakenBy || null,
      amount: parseFloat(data.amount),
      discount: parseFloat(data.discount) || 0,
      discountType: 'percentage',
      paymentType: data.paymentType,
      visitDate: new Date().toISOString(),
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Add to mock data
    mockCustomers.unshift(newCustomer)
    
    return NextResponse.json(newCustomer)
  }
}
