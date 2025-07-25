import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'VoiceCode',
  description: 'AI-powered voice-driven code editor',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  )
}

