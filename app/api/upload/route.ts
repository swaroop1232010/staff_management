import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${timestamp}-${file.name}`
      const filepath = join(uploadsDir, filename)

      await writeFile(filepath, buffer)

      return NextResponse.json({ 
        success: true, 
        filename: filename,
        url: `/uploads/${filename}`
      })
    } catch (fsError) {
      // Fallback for Vercel Serverless environment (read-only filesystem)
      const mimeType = file.type || 'image/jpeg'
      const base64Data = buffer.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64Data}`

      return NextResponse.json({ 
        success: true, 
        filename: file.name,
        url: dataUrl
      })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
