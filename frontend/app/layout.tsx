import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClientProvider } from './providers'
import { AuthProvider } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'God Level Analytics - Analytics para Restaurantes',
  description: 'Plataforma de analytics customizável para restaurantes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryClientProvider>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}

