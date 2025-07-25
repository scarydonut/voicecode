import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-md">
        Welcome to <span className="text-blue-400">VoiceCode</span>
      </h1>

      <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-xl">
        A voice-driven, AI-powered code editor in your browser. Write, edit, and run code using your voice or keyboard.
      </p>

      <Link
        href="/editor"
        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-black via-gray-800 to-black text-white text-lg font-semibold shadow-md hover:shadow-xl hover:scale-105 hover:bg-gray-900 transition-all duration-300"
      >
        Activate Voicecode
      </Link>
    </main>
  )
}
