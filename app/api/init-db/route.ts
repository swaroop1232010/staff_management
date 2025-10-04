import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test database connection and create tables if needed
    await prisma.$connect()
    
    // Try to create a test record to ensure tables exist
    const testCustomer = await prisma.customer.findFirst()
    
    return NextResponse.json({ 
      message: 'Database connected successfully',
      hasData: !!testCustomer,
      tablesExist: true
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error.message,
      suggestion: 'Check DATABASE_URL environment variable'
    }, { status: 500 })
  }
}
