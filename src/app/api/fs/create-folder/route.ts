import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json()

  if (!name || !userId) {
    return NextResponse.json({ error: 'Missing folder name or user ID' }, { status: 400 })
  }

  try {
    const folder = await prisma.folder.create({
      data: {
        name,
        userId,
      },
    })

    return NextResponse.json(folder)
  } catch (err) {
    console.error('❌ Error creating folder:', err)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

