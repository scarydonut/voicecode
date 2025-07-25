import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const systemPrompt = `
You are a code-generation assistant.
- Do not include explanations, comments, or markdown formatting.
- Only output code — no explanations. 
- Infer the language from the prompt (e.g., Python, JavaScript, Java, C++).
- If the prompt is vague, assume common conventions.
-If the user requests a function, class, snippet, or block — generate only that.
- If the prompt includes "wrap in try/catch", "convert to arrow function", or "make class", do exactly that with clean code.
- Always write clean, functional code based on the user's intent. 
-DO NOT explain what you're doing.
- Use proper syntax and indentation
-DO NOT say "Here's the code".
-Just output the code that directly fulfills the user's request.
Examples:
- "write a python function to calculate factorial" → output only the function definition and code.
- "convert this function to arrow syntax" → output only the converted function.
- "wrap this in a try-catch" → output only the new code block.

Handle user typos and incomplete prompts gracefully. Infer intent if possible.
    `.trim()

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    })
    const result = await response.json()
    const code = result?.choices?.[0]?.message?.content?.trim() || ''
    return NextResponse.json({ code })
  } catch (error) {
    console.error('❌ Code generation error:', error)
    return NextResponse.json({ error: 'Code generation failed' }, { status: 500 })
  }
}

