import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { id, content, userId } = await req.json()

  if (!id || content === undefined || !userId) {
    return NextResponse.json({ error: 'Missing file ID, content or user ID' }, { status: 400 })
  }
  try {
    const file = await prisma.file.findUnique({
      where: { id },
    })

    if (!file || file.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized or file not found' }, { status: 403 })
    }
    const updated = await prisma.file.update({
      where: { id },
      data: { content },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('❌ Error saving file:', err)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}
