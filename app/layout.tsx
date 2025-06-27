import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeaveHelp',
  description: 'Created by AI Engineering Team',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
