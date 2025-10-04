import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockCustomers } from '@/lib/mockData'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json(customer)
  } catch (error) {
    // Fallback to mock data
    const customer = mockCustomers.find(c => c.id === params.id)
    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer not found. This customer may have been created in the database but is not available in the current session.' 
      }, { status: 404 })
    }
    return NextResponse.json(customer)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Parse request body once
  let data
  try {
    data = await request.json()
  } catch (parseError) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate required fields
  if (!data.name || !data.contact || !data.amount || !data.paymentType) {
    return NextResponse.json({ 
      error: 'Missing required fields: name, contact, amount, and paymentType are required' 
    }, { status: 400 })
  }

  // Validate services array
  if (!Array.isArray(data.services) || data.services.length === 0) {
    return NextResponse.json({ 
      error: 'Services must be a non-empty array' 
    }, { status: 400 })
  }

  const updateData = {
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
  }

  try {
    // Try to use real database first
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    })
    
    return NextResponse.json(customer)
  } catch (error) {
    // Fallback to mock data
    const customerIndex = mockCustomers.findIndex(c => c.id === params.id)
    if (customerIndex === -1) {
      // If customer not found in mock data, it might be a database-created customer
      return NextResponse.json({ 
        error: 'Customer not found. This customer may have been created in the database but is not available in the current session.' 
      }, { status: 404 })
    }
    
    const updatedCustomer = {
      ...mockCustomers[customerIndex],
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
      notes: data.notes || null,
      updatedAt: new Date().toISOString(),
    }
    
    mockCustomers[customerIndex] = updatedCustomer
    return NextResponse.json(updatedCustomer)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    // Fallback to mock data
    const customerIndex = mockCustomers.findIndex(c => c.id === params.id)
    if (customerIndex === -1) {
      return NextResponse.json({ 
        error: 'Customer not found. This customer may have been created in the database but is not available in the current session.' 
      }, { status: 404 })
    }
    
    mockCustomers.splice(customerIndex, 1)
    return NextResponse.json({ message: 'Customer deleted successfully' })
  }
}
