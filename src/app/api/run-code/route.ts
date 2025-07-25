import { NextRequest, NextResponse } from 'next/server'

const languageVersions: Record<string, string> = {
  javascript: '18.15.0',
  typescript: '5.0.3',
  python: '3.10.0',
  cpp: '10.2.0',
  c: '10.2.0',
  java: '15.0.2',
  go: '1.20.5',
  ruby: '3.2.2',
  php: '8.2.3',
  swift: '5.8.1',
  rust: '1.69.0',
  kotlin: '1.8.20',
  dart: '3.0.5',
  haskell: '9.4.5',
  elixir: '1.14.2',
  clojure: '1.11.1',
  asm: '2.37',
  r: '4.2.0',
  julia: '1.9.0',
  perl: '5.34.0',
  scala: '3.3.0',
  fsharp: '10.2.3',
  bash: '5.1.16',
  mysql: '8.0.33',
}
export async function POST(req: NextRequest) {
  const { code, language, filename, input } = await req.json()

  const version = languageVersions[language]

  if (!version) {
    return NextResponse.json(
      { error: 'Unsupported language or missing version' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        stdin: input || '',
        files: [{ name: filename, content: code }],
      }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Execution error:', err)
    return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 })
  }
}

