'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from "next/link"
import { useAuth } from '@clerk/nextjs'

interface Subscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  tier: 'basic' | 'pro'
  trialEnd: string | null
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()
  const { userId } = useAuth()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      const data = await response.json()

      if (response.ok) {
        setSubscription(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async (action: string, newTier?: string) => {
    if (!subscription) return

    setActionLoading(action)
    setError('')

    try {
      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          subscriptionId: 'mock-subscription-id', // In real app, get from database
          newTier,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscription(prev => prev ? { ...prev, ...data.subscription } : null)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to manage subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trialing': return 'bg-blue-500'
      case 'active': return 'bg-green-500'
      case 'past_due': return 'bg-yellow-500'
      case 'canceled': return 'bg-red-500'
      case 'unpaid': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trialing': return 'Trial'
      case 'active': return 'Active'
      case 'past_due': return 'Past Due'
      case 'canceled': return 'Canceled'
      case 'unpaid': return 'Unpaid'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-bold text-lg sm:text-xl">Cache</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/transactions" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Transactions
              </Link>
              <Link href="/dashboard/budgets" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Budgets
              </Link>
              <Link href="/dashboard/reports" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Reports
              </Link>
              <Link href="/dashboard/savings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Savings
              </Link>
              <Link href="/dashboard/billing" className="text-sm font-medium text-foreground">
                Billing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <UserButton afterSignOutUrl="/" />
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/dashboard" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/transactions" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md">
                    Transactions
                  </Link>
                  <Link href="/dashboard/budgets" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md">
                    Budgets
                  </Link>
                  <Link href="/dashboard/reports" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md">
                    Reports
                  </Link>
                  <Link href="/dashboard/savings" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md">
                    Savings Goals
                  </Link>
                  <Link href="/dashboard/billing" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
                    Billing
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your subscription and billing information</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Subscription Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(subscription.status)}`} />
                        <div>
                          <p className="font-semibold capitalize">{subscription.tier} Plan</p>
                          <p className="text-sm text-muted-foreground">
                            ${subscription.tier === 'basic' ? '20' : '50'}/month
                          </p>
                        </div>
                      </div>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {getStatusText(subscription.status)}
                      </Badge>
                    </div>

                    {subscription.status === 'trialing' && subscription.trialEnd && (
                      <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertDescription>
                          Your free trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}.
                          You'll be charged ${subscription.tier === 'basic' ? '20' : '50'} starting then.
                        </AlertDescription>
                      </Alert>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription will be canceled on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3 pt-4">
                      {subscription.cancelAtPeriodEnd ? (
                        <Button
                          onClick={() => handleManageSubscription('resume')}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === 'resume' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            'Resume Subscription'
                          )}
                        </Button>
                      ) : (
                        <>
                          {subscription.tier === 'basic' && (
                            <Button
                              onClick={() => handleManageSubscription('upgrade', 'pro')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === 'upgrade' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                'Upgrade to Pro'
                              )}
                            </Button>
                          )}
                          {subscription.tier === 'pro' && (
                            <Button
                              variant="outline"
                              onClick={() => handleManageSubscription('upgrade', 'basic')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === 'upgrade' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                'Downgrade to Basic'
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleManageSubscription('cancel')}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === 'cancel' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              'Cancel Subscription'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No active subscription found</p>
                    <Button asChild>
                      <Link href="/pricing">Choose a Plan</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No billing history available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invoices will appear here after your first payment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No payment method on file</p>
                  <Button variant="outline">
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Transactions</span>
                  <span className="text-sm font-medium">42 / {subscription?.tier === 'basic' ? 'Unlimited' : 'Unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Accounts</span>
                  <span className="text-sm font-medium">3 / {subscription?.tier === 'basic' ? '5' : 'Unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reports</span>
                  <span className="text-sm font-medium">5 / Unlimited</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
