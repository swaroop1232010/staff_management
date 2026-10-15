import { NextRequest, NextResponse } from 'next/server'
import { generateStaffManagementEodReport } from '@/lib/eodAdvisor'
import { sendWhatsAppMessage } from '@/lib/ultramsg'
import { SALON_CONFIG } from '@/lib/salonConfig'

export const dynamic = 'force-dynamic'

/**
 * Automated Cron endpoint for daily 21:00 (9:00 PM IST) EOD report
 * Triggered automatically by Vercel Cron or external scheduler
 */
export async function GET(request: NextRequest) {
  try {
    // Optional Vercel CRON_SECRET verification
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 })
    }

    const now = new Date()
    // Fetch today's records strictly without fallback to mock
    const todayReport = await generateStaffManagementEodReport({
      startDate: now,
      endDate: now,
      allowFallback: false,
    })

    const totalWalkins = todayReport.metrics.totalWalkins

    // SALON RULE: Only send if leads or walk-ins occurred today
    if (totalWalkins === 0) {
      console.log('[Auto EOD Cron] 0 walk-ins or leads recorded today. Skipping automatic 9:00 PM dispatch.')
      return NextResponse.json({
        success: true,
        sent: false,
        reason: 'Zero walk-ins or leads recorded today. Automatic dispatch skipped as per salon policy.',
        metrics: todayReport.metrics,
      })
    }

    const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER || SALON_CONFIG.ownerWhatsAppFormatted
    console.log(`[Auto EOD Cron] Found ${totalWalkins} walk-ins/leads. Dispatching 9:00 PM EOD report to owner (${ownerPhone})...`)

    const result = await sendWhatsAppMessage(ownerPhone, todayReport.formattedWhatsAppText)

    return NextResponse.json({
      success: true,
      sent: true,
      recipient: ownerPhone,
      totalWalkins,
      totalRevenue: todayReport.metrics.totalRevenue,
      ultraMsgResult: result,
      summary: todayReport.metrics,
    })
  } catch (error: any) {
    console.error('[Auto EOD Cron] Error executing automated EOD dispatch:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch auto EOD report' },
      { status: 500 }
    )
  }
}
