'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Loader2, Mountain } from 'lucide-react'
import Link from "next/link"
import { SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'

const plans = [
  {
    name: 'Basic',
    price: 20,
    period: 'month',
    description: 'Perfect for individuals managing personal finances',
    features: [
      { name: 'Up to 5 accounts', included: true },
      { name: 'Transaction tracking', included: true },
      { name: 'Budget management', included: true },
      { name: 'Basic financial reports', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'CSV/PDF exports', included: false },
      { name: 'Priority support', included: false },
      { name: 'Unlimited accounts', included: false },
    ],
    buttonText: 'Start Free Trial',
    popular: false,
    tier: 'basic' as const,
  },
  {
    name: 'Pro',
    price: 50,
    period: 'month',
    description: 'Advanced features for serious financial management',
    features: [
      { name: 'Unlimited accounts', included: true },
      { name: 'Transaction tracking', included: true },
      { name: 'Budget management', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'CSV/PDF exports', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Priority support', included: true },
      { name: 'Custom categories', included: true },
    ],
    buttonText: 'Start Free Trial',
    popular: true,
    tier: 'pro' as const,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSubscribe = async (tier: 'basic' | 'pro') => {
    setLoading(tier)

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe checkout or handle client secret
      if (data.clientSecret) {
        // In a real app, you'd redirect to Stripe checkout
        console.log('Client secret:', data.clientSecret)
        // For now, just redirect to dashboard
        router.push('/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Mountain className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold text-lg md:text-xl">Cache</span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-4 md:gap-6">
          <Link href="/" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="#features" className="text-xs sm:text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
        </nav>
      </header>

      <main className="container px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required to get started.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
                  <>
                    <SignedOut>
                      <SignUpButton mode="modal">
                        <Button
                          className="w-full mt-6"
                          variant={plan.popular ? 'default' : 'outline'}
                          size="lg"
                        >
                          {loading === plan.tier ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting Trial...
                            </>
                          ) : (
                            plan.buttonText
                          )}
                        </Button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <Button
                        className="w-full mt-6"
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => handleSubscribe(plan.tier)}
                        disabled={!!loading}
                      >
                        {loading === plan.tier ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting Trial...
                          </>
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    </SignedIn>
                  </>
                ) : (
                  <Button
                    asChild
                    className="w-full mt-6"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link href="/sign-up">
                      {plan.buttonText}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after my trial ends?</h3>
              <p className="text-muted-foreground">
                After your 14-day free trial, you'll be charged the monthly rate. You can cancel before the trial ends to avoid charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Absolutely! You can upgrade or downgrade your plan at any time from your billing settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">
                Yes, we use industry-standard encryption and security practices to protect your financial data.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-muted-foreground mb-4">
            Need help choosing the right plan?
          </p>
          <Button variant="outline" asChild>
            <Link href="mailto:support@cacheapp.com">Contact Support</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
