import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockCustomers } from '@/lib/mockData'
import { segmentCustomers, buildTargetedMessage, SEGMENT_DEFINITIONS, ServiceSegmentType } from '@/lib/campaignAdvisor'
import { sendWhatsAppMessage, sendWhatsAppImage } from '@/lib/ultramsg'

export const dynamic = 'force-dynamic'

async function getAllCustomers(): Promise<any[]> {
  if (Boolean(process.env.DATABASE_URL)) {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { visitDate: 'desc' },
      })
      if (customers && customers.length > 0) {
        return customers
      }
    } catch (e) {
      console.warn('Prisma fetch failed, using fallback customer list:', e)
    }
  }
  return mockCustomers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentParam = searchParams.get('segment') as ServiceSegmentType | null

    const customers = await getAllCustomers()
    const { allSegmented, segments, summary } = segmentCustomers(customers)

    const filtered =
      segmentParam && segments[segmentParam]
        ? segments[segmentParam]
        : allSegmented

    return NextResponse.json({
      success: true,
      totalCustomers: customers.length,
      filteredCount: filtered.length,
      segmentsSummary: summary,
      definitions: SEGMENT_DEFINITIONS,
      customers: filtered,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch campaign segments'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipients,
      customOfferText,
      imageUrl,
      selectedSegment,
      testOnly,
    } = body

    let targetList: Array<{ id: string; name: string; contact: string; message: string }> = []

    if (Array.isArray(recipients) && recipients.length > 0) {
      targetList = recipients
    } else {
      // Auto-compute from database/mock data
      const customers = await getAllCustomers()
      const { allSegmented, segments } = segmentCustomers(customers)

      const sourceList =
        selectedSegment && selectedSegment !== 'all' && segments[selectedSegment as ServiceSegmentType]
          ? segments[selectedSegment as ServiceSegmentType]
          : allSegmented

      targetList = sourceList.map((c) => ({
        id: c.id,
        name: c.name,
        contact: c.contact,
        message: buildTargetedMessage(c.name, c.primaryCategory, customOfferText),
      }))
    }

    if (testOnly) {
      // If testing mode, only send to the first recipient or return simulation
      targetList = targetList.slice(0, 1)
    }

    const results: Array<{
      id: string
      name: string
      contact: string
      success: boolean
      messageId?: string
      error?: string
    }> = []

    let sentCount = 0
    let failedCount = 0

    for (const recipient of targetList) {
      if (!recipient.contact) {
        results.push({
          id: recipient.id,
          name: recipient.name,
          contact: '',
          success: false,
          error: 'Missing contact number',
        })
        failedCount++
        continue
      }

      const res =
        imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0
          ? await sendWhatsAppImage(recipient.contact, imageUrl.trim(), recipient.message)
          : await sendWhatsAppMessage(recipient.contact, recipient.message)

      if (res.success) {
        sentCount++
        results.push({
          id: recipient.id,
          name: recipient.name,
          contact: recipient.contact,
          success: true,
          messageId: res.messageId,
        })
      } else {
        failedCount++
        results.push({
          id: recipient.id,
          name: recipient.name,
          contact: recipient.contact,
          success: false,
          error: res.error,
        })
      }

      // 500ms delay between dispatches to maintain safe delivery rhythm
      if (targetList.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      success: true,
      totalTargets: targetList.length,
      sentCount,
      failedCount,
      results,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Campaign dispatch failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
