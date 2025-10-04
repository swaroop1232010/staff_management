import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const timeFilter = searchParams.get('timeFilter') || 'daily'
    const serviceFilter = searchParams.get('serviceFilter') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Build where clause for date range
    const whereClause: any = {
      visitDate: {
        gte: startOfDay(start),
        lte: endOfDay(end)
      }
    }

    // Add service filter if not 'all'
    if (serviceFilter !== 'all') {
      whereClause.services = {
        contains: serviceFilter
      }
    }

    // Fetch customers data
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { visitDate: 'asc' }
    })

    // Calculate totals
    const totalAmount = customers.reduce((sum, customer) => sum + customer.amount, 0)
    const totalCustomers = customers.length
    const averageAmount = totalCustomers > 0 ? totalAmount / totalCustomers : 0

    // Service breakdown
    const serviceMap = new Map<string, { count: number; amount: number }>()
    customers.forEach(customer => {
      try {
        const services = JSON.parse(customer.services)
        services.forEach((service: string) => {
          if (serviceFilter === 'all' || service === serviceFilter) {
            const existing = serviceMap.get(service) || { count: 0, amount: 0 }
            serviceMap.set(service, {
              count: existing.count + 1,
              amount: existing.amount + customer.amount
            })
          }
        })
      } catch (error) {
        console.error('Error parsing services:', error)
      }
    })

    const serviceBreakdown = Array.from(serviceMap.entries()).map(([service, data]) => ({
      service,
      count: data.count,
      amount: data.amount
    })).sort((a, b) => b.amount - a.amount)

    // Staff breakdown
    const staffMap = new Map<string, { count: number; amount: number }>()
    customers.forEach(customer => {
      if (customer.serviceTakenBy) {
        const existing = staffMap.get(customer.serviceTakenBy) || { count: 0, amount: 0 }
        staffMap.set(customer.serviceTakenBy, {
          count: existing.count + 1,
          amount: existing.amount + customer.amount
        })
      }
    })

    const staffBreakdown = Array.from(staffMap.entries()).map(([staff, data]) => ({
      staff,
      count: data.count,
      amount: data.amount
    })).sort((a, b) => b.amount - a.amount)

    // Payment type breakdown
    const paymentMap = new Map<string, { count: number; amount: number }>()
    customers.forEach(customer => {
      const existing = paymentMap.get(customer.paymentType) || { count: 0, amount: 0 }
      paymentMap.set(customer.paymentType, {
        count: existing.count + 1,
        amount: existing.amount + customer.amount
      })
    })

    const paymentTypeBreakdown = Array.from(paymentMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount
    })).sort((a, b) => b.amount - a.amount)

    // Daily data for trend
    const dailyData: { date: string; amount: number; customers: number }[] = []
    
    if (timeFilter === 'daily') {
      // Single day
      const dayAmount = customers.reduce((sum, customer) => sum + customer.amount, 0)
      dailyData.push({
        date: format(start, 'yyyy-MM-dd'),
        amount: dayAmount,
        customers: customers.length
      })
    } else {
      // Multiple days
      const days = eachDayOfInterval({ start, end })
      days.forEach(day => {
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)
        
        const dayCustomers = customers.filter(customer => {
          const customerDate = new Date(customer.visitDate)
          return customerDate >= dayStart && customerDate <= dayEnd
        })
        
        const dayAmount = dayCustomers.reduce((sum, customer) => sum + customer.amount, 0)
        
        dailyData.push({
          date: format(day, 'yyyy-MM-dd'),
          amount: dayAmount,
          customers: dayCustomers.length
        })
      })
    }

    const reportData = {
      totalAmount,
      totalCustomers,
      averageAmount,
      serviceBreakdown,
      staffBreakdown,
      paymentTypeBreakdown,
      dailyData
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
  }
}
