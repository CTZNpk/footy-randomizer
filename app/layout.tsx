import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Footy — Weighted Team Randomizer',
  description: 'Spin a weighted wheel to split the players who showed up into two teams.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
