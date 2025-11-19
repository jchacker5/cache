import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProviderWrapper } from '@/components/providers/clerk-provider'
import { ConvexClientProvider } from './ConvexClientProvider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cache - Smart Spending Management',
  description: 'Manage your spending with ease and precision. Track budgets, analyze expenses, and achieve your financial goals.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ConvexClientProvider>
          <ClerkProviderWrapper>
            {children}
            <Toaster position="top-right" richColors />
          </ClerkProviderWrapper>
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
