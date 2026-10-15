import { prisma } from './prisma'

let tableInitialized = false

/**
 * Ensures the campaign_sent_history table exists in PostgreSQL without requiring manual migrations.
 */
export async function initCampaignHistoryTable(): Promise<boolean> {
  if (tableInitialized) return true
  if (!process.env.DATABASE_URL) return false

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS campaign_sent_history (
        contact VARCHAR(30) PRIMARY KEY,
        customer_id VARCHAR(50),
        customer_name VARCHAR(100),
        message_id VARCHAR(100),
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
    tableInitialized = true
    return true
  } catch (e) {
    console.warn('Failed to ensure campaign_sent_history table:', e)
    return false
  }
}

/**
 * Retrieves all phone numbers that have permanently received promotional campaigns from the database.
 */
export async function getDbSentContacts(): Promise<string[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    await initCampaignHistoryTable()
    const rows = await prisma.$queryRawUnsafe<Array<{ contact: string }>>(
      `SELECT contact FROM campaign_sent_history;`
    )
    if (Array.isArray(rows)) {
      const contacts = new Set<string>()
      rows.forEach((r) => {
        const clean = (r.contact || '').replace(/\D/g, '')
        if (clean) {
          contacts.add(clean)
          if (clean.length >= 10) {
            contacts.add(clean.slice(-10))
            contacts.add(`91${clean.slice(-10)}`)
          }
        }
      })
      return Array.from(contacts)
    }
  } catch (e) {
    console.warn('Failed to query campaign_sent_history:', e)
  }
  return []
}

/**
 * Permanently records a successfully sent campaign message in the database.
 */
export async function recordDbCampaignSent(
  contact: string,
  customerId?: string,
  customerName?: string,
  messageId?: string
): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const clean = contact.replace(/\D/g, '')
  if (!clean || clean.length < 10) return

  const tenDigit = clean.slice(-10)

  try {
    await initCampaignHistoryTable()
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO campaign_sent_history (contact, customer_id, customer_name, message_id, sent_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (contact) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        message_id = EXCLUDED.message_id,
        sent_at = CURRENT_TIMESTAMP;
      `,
      tenDigit,
      customerId || null,
      customerName || null,
      messageId || null
    )
  } catch (e) {
    console.warn('Failed to record campaign sent to DB:', e)
  }
}

/**
 * Clears the campaign sent history table in PostgreSQL when the user clicks 'Reset Sent Log'.
 */
export async function clearDbCampaignHistory(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true
  try {
    await initCampaignHistoryTable()
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE campaign_sent_history;`)
    return true
  } catch (e) {
    console.warn('Failed to clear campaign_sent_history:', e)
    return false
  }
}
