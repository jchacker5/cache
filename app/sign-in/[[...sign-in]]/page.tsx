'use client'

import { SignIn } from '@clerk/nextjs'
import { Mountain } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Mountain className="h-8 w-8 text-white" />
            <span className="font-bold text-2xl text-white">Cache</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-300">Sign in to your account to continue</p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-white text-black hover:bg-gray-100 transition-colors',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                socialButtonsBlockButtonText: 'text-white',
                formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                formFieldLabel: 'text-white',
                footerActionLink: 'text-white hover:text-gray-300',
                dividerLine: 'bg-white/20',
                dividerText: 'text-gray-400',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-white hover:text-gray-300',
                formFieldInputShowPasswordButton: 'text-white',
                alert: 'bg-red-500/10 border-red-500/20 text-red-400',
              },
            }}
            routing="path"
            path="/sign-in"
            redirectUrl="/dashboard"
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-white hover:text-gray-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
