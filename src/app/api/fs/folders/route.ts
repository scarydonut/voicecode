import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json([], { status: 200 })
    }

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: { files: true },
    })
    return NextResponse.json(folders)
  } catch (err) {
    console.error('❌ Failed to fetch folders:', err)
    return NextResponse.json({ error: 'Failed to load folders' }, { status: 500 })
  }
}

