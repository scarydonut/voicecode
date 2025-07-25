import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return NextResponse.json({ keyExists: false, error: 'Key not found' }, { status: 500 })
    }

    return NextResponse.json({ keyExists: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
