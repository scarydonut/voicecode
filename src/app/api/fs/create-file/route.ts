import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, content, folderId, userId } = await req.json()

  if (!name || !folderId || !userId) {
    return NextResponse.json({ error: 'Missing name, folderId, or userId' }, { status: 400 })
  }

  try {
    const file = await prisma.file.create({
      data: {
        name,
        content: content || '',
        folderId,
        userId,
      },
    })
    return NextResponse.json(file)
  } catch (err) {
    console.error('❌ Failed to create file:', err)
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 })
  }
}
