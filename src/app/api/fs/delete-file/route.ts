import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json()

  if (!id || !userId) {
    return NextResponse.json({ error: 'Missing file ID or user ID' }, { status: 400 })
  }

  try {
    const file = await prisma.file.findUnique({ where: { id } })

    if (!file || file.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized or file not found' }, { status: 403 })
    }

    await prisma.file.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete file:', err)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
