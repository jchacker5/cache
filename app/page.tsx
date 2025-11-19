'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mountain, Shield, Zap, BarChart3, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from "next/link"
import { Globe } from "@/components/landing/globe"
import { FeatureCard } from "@/components/landing/feature-card"
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Component() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Mountain className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold text-lg md:text-xl">Cache</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4 md:gap-6 items-center">
          <Link href="#features" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors hidden sm:inline">
            Pricing
          </Link>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden flex items-center justify-center">
          <Globe />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background pointer-events-none" />

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                New: AI-Powered Insights
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                Master Your Money <br className="hidden sm:inline" />
                With Precision
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Experience the future of financial management. Real-time tracking, intelligent insights, and effortless control over your wealth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6 mt-8">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="h-12 px-8 text-base">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base backdrop-blur-sm bg-background/50">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Button asChild size="lg" className="h-12 px-8 text-base">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full py-12 border-y bg-muted/30">
          <div className="container px-4 md:px-6">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              TRUSTED BY FORWARD-THINKING FINANCE TEAMS
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholder Logos using text for now, ideally SVGs */}
              <div className="flex items-center gap-2 font-bold text-xl"><Shield className="h-6 w-6" /> SecureBank</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Zap className="h-6 w-6" /> FastPay</div>
              <div className="flex items-center gap-2 font-bold text-xl"><BarChart3 className="h-6 w-6" /> GrowthFund</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Wallet className="h-6 w-6" /> SmartWallet</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 md:py-32" id="features">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Everything you need to succeed
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Powerful features designed to give you complete control over your financial life.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                title="Real-time Tracking"
                description="Monitor your transactions as they happen with sub-second latency updates."
                icon={Zap}
              />
              <FeatureCard
                title="AI Insights"
                description="Get personalized recommendations and spending analysis powered by advanced ML."
                icon={BarChart3}
              />
              <FeatureCard
                title="Bank-Grade Security"
                description="Your data is encrypted with AES-256 and protected by multi-factor authentication."
                icon={Shield}
              />
              <FeatureCard
                title="Smart Budgeting"
                description="Set dynamic budgets that adjust automatically based on your spending habits."
                icon={Wallet}
              />
              <FeatureCard
                title="Goal Tracking"
                description="Visualize your progress towards financial goals with interactive charts."
                icon={Mountain}
              />
              <FeatureCard
                title="Automated Savings"
                description="Automatically round up purchases and save the difference to your vault."
                icon={CheckCircle2}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Ready to take control?
                </h2>
                <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl">
                  Join thousands of users who have transformed their financial health with Cache.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-4">
                <form className="flex flex-col sm:flex-row gap-2">
                  <Input
                    className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/50"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <Button type="submit" variant="secondary" className="w-full sm:w-auto font-bold">
                    Get Started
                  </Button>
                </form>
                <p className="text-xs text-primary-foreground/60">
                  No credit card required. 14-day free trial.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground text-center sm:text-left">© 2025 Cache Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
