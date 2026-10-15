/**
 * UltraMsg WhatsApp Gateway Helper for Staff Management
 * Sends WhatsApp messages directly via QR-Linked Business Phone instance
 */

export interface UltraMsgSendResult {
  success: boolean
  messageId?: string
  error?: string
  details?: Record<string, unknown>
}

export interface UltraMsgHistoryReport {
  sent: string[]
  invalid: Array<{ phone: string; reason?: string }>
  unsent: Array<{ phone: string; reason?: string }>
}

function getUltraMsgConfig() {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID || 'instance194285'
  let token = process.env.ULTRAMSG_TOKEN
  if (!token) {
    token = instanceId.includes('194011') ? 'b5tp2o693pet6kem' : 'zrp1k82k8bhyhllf'
  }
  return { instanceId, token }
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<UltraMsgSendResult> {
  const { instanceId, token } = getUltraMsgConfig()

  // Sanitize recipient phone number
  const cleanPhone = phone.replace(/\D/g, '')
  // Ensure country code (default to 91 for India if 10 digits)
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  if (!fullPhone || fullPhone.length < 10) {
    return { success: false, error: 'Invalid phone number provided' }
  }

  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat?token=${encodeURIComponent(token)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        to: `+${fullPhone}`,
        body: message,
      }),
    })

    const result = (await response.json()) as Record<string, unknown>

    if (!response.ok || result?.error) {
      const errMsg = (result?.error as string) || `UltraMsg returned status ${response.status}`
      return {
        success: false,
        error: errMsg,
        details: result,
      }
    }

    return {
      success: true,
      messageId: (result?.id as string) || (result?.message as string) || 'sent',
      details: result,
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Network error contacting UltraMsg'
    return {
      success: false,
      error: errMsg,
    }
  }
}

/**
 * Sends a promotional image/flyer with caption via UltraMsg WhatsApp Gateway
 */
export async function sendWhatsAppImage(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<UltraMsgSendResult> {
  const { instanceId, token } = getUltraMsgConfig()

  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  if (!fullPhone || fullPhone.length < 10) {
    return { success: false, error: 'Invalid phone number provided' }
  }

  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages/image?token=${encodeURIComponent(token)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        to: `+${fullPhone}`,
        image: imageUrl,
        caption: caption || '',
      }),
    })

    const result = (await response.json()) as Record<string, unknown>

    if (!response.ok || result?.error) {
      const errMsg = (result?.error as string) || `UltraMsg returned status ${response.status}`
      return {
        success: false,
        error: errMsg,
        details: result,
      }
    }

    return {
      success: true,
      messageId: (result?.id as string) || (result?.message as string) || 'sent',
      details: result,
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Network error contacting UltraMsg'
    return {
      success: false,
      error: errMsg,
    }
  }
}

/**
 * Queries UltraMsg instance for recent message history to discover
 * which numbers were already sent, unsent, or flagged as invalid.
 */
export async function getUltraMsgMessageHistory(limit = 100): Promise<UltraMsgHistoryReport> {
  const { instanceId, token } = getUltraMsgConfig()
  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages?token=${encodeURIComponent(token)}&limit=${limit}`
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    })

    const data = (await response.json()) as Record<string, unknown>
    if (!response.ok || data?.error) {
      console.warn('UltraMsg history returned error:', data?.error)
      return { sent: [], invalid: [], unsent: [] }
    }

    const messages = Array.isArray(data?.messages) ? (data.messages as Array<Record<string, unknown>>) : []
    const sentSet = new Set<string>()
    const invalidList: Array<{ phone: string; reason?: string }> = []
    const unsentList: Array<{ phone: string; reason?: string }> = []

    for (const m of messages) {
      const rawPhone = String(m?.to || '').replace(/\D/g, '')
      if (!rawPhone) continue
      const tenDigit = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone
      const status = String(m?.status || '').toLowerCase()
      const reason = String(m?.failed_reason || '')

      if (status === 'sent') {
        sentSet.add(rawPhone)
        sentSet.add(tenDigit)
      } else if (status === 'invalid') {
        invalidList.push({
          phone: tenDigit,
          reason: reason || 'Invalid contact / Not on WhatsApp',
        })
      } else if (status === 'unsent') {
        unsentList.push({
          phone: tenDigit,
          reason: reason || 'Delivery failed / Unsent',
        })
      }
    }

    return {
      sent: Array.from(sentSet),
      invalid: invalidList,
      unsent: unsentList,
    }
  } catch (error: unknown) {
    console.warn('Failed to fetch UltraMsg message history:', error)
    return { sent: [], invalid: [], unsent: [] }
  }
}
