'use client'

import { ClerkProvider } from '@clerk/nextjs'

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorText: 'hsl(var(--foreground))',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'shadow-lg border border-border',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
