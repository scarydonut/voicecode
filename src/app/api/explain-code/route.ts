import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing code input' }, { status: 400 })
    }
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenRouter API key' }, { status: 500 })
    }
    const prompt = `Explain the following code in simple terms:\n\n${code}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "system",
            content: "You are a helpful code explainer. Always respond with a concise explanation in plain text only."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    const result = await response.json()
    console.log("🧠 Raw response from OpenRouter:", result)
    const explanation = result?.choices?.[0]?.message?.content?.trim()
    if (!explanation) {
      return NextResponse.json({ error: 'No explanation found in response' }, { status: 500 })
    }
    return NextResponse.json({ explanation })
  } catch (err) {
    console.error('❌ Error in /api/explain-code:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

