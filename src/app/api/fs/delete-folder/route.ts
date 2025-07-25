import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json()

  if (!id || !userId) {
    return NextResponse.json({ error: 'Missing folder ID or user ID' }, { status: 400 })
  }
  try {
    const folder = await prisma.folder.findUnique({ where: { id } })

    if (!folder || folder.userId !== userId) {
      return NextResponse.json({ error: 'Folder not found or unauthorized' }, { status: 404 })
    }
    await prisma.file.deleteMany({ where: { folderId: id, userId } })
    await prisma.folder.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete folder error:', err)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}

