import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    console.log('📥 Received voice command:', text)

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenRouter API key' }, { status: 500 })
    }

    const prompt = `
You're a voice assistant for a web code editor.

If the user says something like "delete line 326", and the context suggests a range (e.g. "3 to 6"), infer startLine: 3 and endLine: 6.

Parse digits like "326" as a line range if it seems like it was meant to be "3 to 6".
If the command contains small speech transcription errors (e.g., "right hello world" instead of "write hello world"), try to interpret the intent correctly.

From the user's spoken command, extract:
- "action": one of [createFile, deleteFile, clearFile, write, saveFile, moveCursor, explain, renameFile, runFile, deleteLine,createFolder, deleteFolder]
- "filename": required for createFile, deleteFile, saveFile
- "content": only if action is write
- "folder": for createFolder, deleteFolder, or createFile in folder
- "line": number (required for moveCursor)
- "explain": used when user says "explain this", "explain line 4", etc.
- "runFile": to run any file
- "renameFile": requires oldName and newName
- "deleteLine": can support deleting a single line or a range using startLine and endLine
- "action": one of [..., commentBlock, uncommentBlock]
- "action": one of [..., replaceText]
- "action": one of [..., copyLine, pasteAt]

Examples:
- "Create a file named index.js" → { "action": "createFile", "filename": "index.js" }
- "Create a folder named utils" → { "action": "createFolder", "folder": "utils" }
- "Delete style.css" → { "action": "deleteFile", "filename": "style.css" }
- "Move cursor to line 10" → { "action": "moveCursor", "line": 10 }
- "Move cursor to line 8 in app.js" → { "action": "moveCursor", "filename": "app.js", "line": 8 }
- "Write hello world" → { "action": "write", "content": "hello world" }
- "Save index.js" → { "action": "saveFile", "filename": "index.js" }
- "Run index.js" → { "action": "runFile", "filename": "index.js" }
- "Rename index.js to main.js" → { "action": "renameFile", "oldName": "index.js", "newName": "main.js" }
- "Delete line 12" → { "action": "deleteLine", "line": 12 }
- "Delete lines 5 to 10" → { "action": "deleteLine", "startLine": 5, "endLine": 10 }
- "Delete lines 3 to 6" → { "action": "deleteLine", "startLine": 3, "endLine": 6 }
- "Delete line 326" (if spoken as "three to six") → { "action": "deleteLine", "startLine": 3, "endLine": 6 }
- "Comment the selected block" → { "action": "commentBlock" }
- "Uncomment this" → { "action": "uncommentBlock" }
- "Replace all foo with totalAmount" → { "action": "replaceText", "target": "foo", "replacement": "totalAmount" }
- "Copy line 4" → { "action": "copyLine", "line": 4 }
- "Paste at line 10" → { "action": "pasteAt", "line": 10 }
- "Delete file app.js" → { "action": "deleteFile", "filename": "app.js" }
- "Delete folder utils" → { "action": "deleteFolder", "folder": "utils" }
- "Right hello world" → { "action": "write", "content": "hello world" }
- "Create file app.js in folder happy" → { "action": "createFile", "filename": "app.js", "folder": "happy" }

If the command is unclear or missing required fields, return:
{ "action": "none" }

Only return valid JSON. No explanations or markdown.
Input: ${text}
`

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
            content: "You are a voice-command parser for a code editor. Only return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    const result = await response.json()
    console.log('📦 OpenRouter response:', result)
    const raw = result?.choices?.[0]?.message?.content
    if (!raw) throw new Error('❌ No response text found')
    const jsonMatch = raw.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) throw new Error('❌ No JSON found')

    const parsed = JSON.parse(jsonMatch[0])
    console.log("📤 Parsed JSON:", parsed)
    if (
      (parsed.action === 'deleteFile' || parsed.action === 'saveFile') &&
      !parsed.filename
    ) {
      parsed.action = 'none'
    }
    if (parsed.action === 'moveCursor' && typeof parsed.line !== 'number') {
      parsed.action = 'none'
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('❌ OpenRouter error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

