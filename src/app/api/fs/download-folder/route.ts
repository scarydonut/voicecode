import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { folder } = body

    if (!folder || !Array.isArray(folder.files)) {
      return NextResponse.json({ error: 'Invalid folder data' }, { status: 400 })
    }
    const zip = new JSZip()
    for (const file of folder.files) {
      zip.file(file.name, file.content || '')
    }
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' })
   return new NextResponse(new Uint8Array(zipContent), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${folder.name}.zip`,
      },
    })
  } catch (error) {
    console.error('ZIP error:', error)
    return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 })
  }
}
