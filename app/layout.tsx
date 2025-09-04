import type { Metadata } from 'next'
import { Inter, DM_Mono } from 'next/font/google'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { CoachProvider } from '@/src/contexts/CoachContext'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const dmMono = DM_Mono({ 
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'AI Coach',
  description: 'AI-powered coaching application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmMono.variable} font-inter`}>
        <AuthProvider>
          <CoachProvider>
            {children}
          </CoachProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
