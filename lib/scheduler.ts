/**
 * In-memory background scheduler for End-Of-Day WhatsApp report
 * Runs at 9:00 PM daily (or configured time).
 * 
 * RULE: Only sends if at least 1 customer/lead was recorded for the day.
 * If 0 walk-ins/leads occurred today, the automatic message is skipped.
 */

let isSchedulerRunning = false
let lastSentDate: string | null = null

export function initEodScheduler() {
  if (isSchedulerRunning) return
  isSchedulerRunning = true

  console.log('[EOD Scheduler] Background scheduler initialized (Default: 21:00 / 9:00 PM daily)...')

  setInterval(async () => {
    try {
      const now = new Date()
      const currentHours = String(now.getHours()).padStart(2, '0')
      const currentMinutes = String(now.getMinutes()).padStart(2, '0')
      const currentTimeStr = `${currentHours}:${currentMinutes}`

      // Default to 21:00 (9:00 PM) daily
      const scheduledTime = process.env.EOD_REPORT_SCHEDULED_TIME || '21:00'
      const todayDateStr = now.toISOString().slice(0, 10)

      // Check if scheduled time matches and hasn't been sent today yet
      if (currentTimeStr === scheduledTime && lastSentDate !== todayDateStr) {
        lastSentDate = todayDateStr
        console.log(`[EOD Scheduler] 9:00 PM trigger reached (${currentTimeStr}). Checking today's walk-ins/leads...`)

        const { generateStaffManagementEodReport } = await import('./eodAdvisor')
        const { sendWhatsAppMessage } = await import('./ultramsg')

        // Fetch today's records strictly without fallback to mock
        const todayReport = await generateStaffManagementEodReport({
          startDate: now,
          endDate: now,
          allowFallback: false,
        })

        // RULE: Only send if leads/walk-ins occurred as of the day
        if (todayReport.metrics.totalWalkins === 0) {
          console.log('[EOD Scheduler] No walk-ins or leads recorded today (0). Skipping automatic 9:00 PM dispatch as instructed.')
          return
        }

        console.log(`[EOD Scheduler] Found ${todayReport.metrics.totalWalkins} walk-ins/leads today. Sending automatic EOD report to owner...`)
        const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER || '918501020553'
        const result = await sendWhatsAppMessage(ownerPhone, todayReport.formattedWhatsAppText)

        console.log('[EOD Scheduler] Auto-dispatch result:', result)
      }
    } catch (err) {
      console.error('[EOD Scheduler] Error during background check:', err)
    }
  }, 25000) // Checks every 25 seconds
}

export function getSchedulerStatus() {
  const now = new Date()
  const currentHours = String(now.getHours()).padStart(2, '0')
  const currentMinutes = String(now.getMinutes()).padStart(2, '0')
  return {
    running: isSchedulerRunning,
    currentTime: `${currentHours}:${currentMinutes}`,
    scheduledTime: process.env.EOD_REPORT_SCHEDULED_TIME || '21:00',
    ownerPhone: process.env.OWNER_WHATSAPP_NUMBER || '918501020553',
    lastSentDate,
    rule: 'Only sends if at least 1 walk-in/lead recorded for today',
  }
}
