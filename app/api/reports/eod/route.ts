import { NextRequest, NextResponse } from 'next/server'
import { generateStaffManagementEodReport } from '@/lib/eodAdvisor'
import { sendWhatsAppMessage } from '@/lib/ultramsg'
import { initEodScheduler, getSchedulerStatus } from '@/lib/scheduler'
import { SALON_CONFIG } from '@/lib/salonConfig'

export const dynamic = 'force-dynamic'

// Ensure scheduler is active
initEodScheduler()

export async function GET(request: NextRequest) {
  try {
    initEodScheduler()
    const { searchParams } = new URL(request.url)
    const shouldSend = searchParams.get('send') === 'true'
    const phoneOverride = searchParams.get('phone')
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const allowFallback = searchParams.get('allowFallback') === 'true'

    const ownerPhone =
      phoneOverride ||
      process.env.OWNER_WHATSAPP_NUMBER ||
      SALON_CONFIG.ownerWhatsAppFormatted
    const scheduledTime = process.env.EOD_REPORT_SCHEDULED_TIME || '21:00'

    const report = await generateStaffManagementEodReport({
      startDate,
      endDate,
      allowFallback,
    })
    const scheduler = getSchedulerStatus()

    let sendResult = null
    if (shouldSend) {
      sendResult = await sendWhatsAppMessage(ownerPhone, report.formattedWhatsAppText)
    }

    return NextResponse.json({
      success: true,
      ownerPhone,
      scheduledTime,
      scheduler,
      startDate,
      endDate,
      metrics: report.metrics,
      aiSuggestions: report.aiSuggestions,
      preview: report.formattedWhatsAppText,
      sent: shouldSend,
      sendResult,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch {}

    const ownerPhone =
      body.phone ||
      process.env.OWNER_WHATSAPP_NUMBER ||
      SALON_CONFIG.ownerWhatsAppFormatted
    const customMessage = body.customMessage
    const startDate = body.startDate || undefined
    const endDate = body.endDate || undefined
    const allowFallback = body.allowFallback === true

    const report = await generateStaffManagementEodReport({
      startDate,
      endDate,
      allowFallback,
    })
    const messageToSend = customMessage || report.formattedWhatsAppText

    const sendResult = await sendWhatsAppMessage(ownerPhone, messageToSend)

    return NextResponse.json({
      success: sendResult.success,
      sentTo: ownerPhone,
      messageId: sendResult.messageId,
      error: sendResult.error,
      details: sendResult.details,
      preview: messageToSend,
      metrics: report.metrics,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
