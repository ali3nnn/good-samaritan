import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Good Samaritan - Remote People Mapper',
  description: 'Map remote locations to help visitors find and reach people in hard-to-access areas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full w-full">
      <body className={`${inter.className} h-full w-full`}>{children}</body>
    </html>
  )
}
