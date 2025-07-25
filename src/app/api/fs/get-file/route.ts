import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { id, userId } = await req.json()

  if (!id || !userId) {
    return NextResponse.json({ error: 'Missing file ID or user ID' }, { status: 400 })
  }
  try {
    const file = await prisma.file.findFirst({
      where: {
        id,
        userId,
      },
    })
    if (!file) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 })
    }
    return NextResponse.json(file)
  } catch (err) {
    console.error('❌ Failed to fetch file:', err)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
