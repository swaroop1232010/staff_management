import fs from 'fs'
import path from 'path'

export interface AppSettings {
  monthlyRewardThreshold: number
}

const defaultSettings: AppSettings = {
  monthlyRewardThreshold: 5000,
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json')

let memorySettings: AppSettings = { ...defaultSettings }

export function getSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      return { ...defaultSettings, ...parsed }
    }
  } catch (error) {
    console.error('Error reading settings file, using memory/default:', error)
  }
  return memorySettings
}

export function updateSettings(newSettings: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...newSettings }
  memorySettings = updated
  try {
    const dir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing settings file:', error)
  }
  return updated
}
