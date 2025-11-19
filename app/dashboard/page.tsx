'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, BarChart3, ShoppingCart, Search, Loader2, TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, MessageCircle, Plus, ArrowUpRight, ArrowDownRight, Calendar, CreditCard } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { useSafeUser } from '@/hooks/use-safe-user'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardMetrics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  budgetUtilization: number
  recentTransactions: any[]
  topCategories: any[]
  aiInsights: any[]
  budgets: any[]
}

export default function Dashboard() {
  const { user } = useSafeUser()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load various data sources
      const [transactions, accounts, budgets, insights] = await Promise.all([
        DataService.getTransactions(user.id),
        DataService.getAccounts(user.id),
        DataService.getBudgets(user.id),
        DataService.getAiInsights(user.id)
      ])

      // Calculate dashboard metrics
      const dashboardMetrics = calculateDashboardMetrics(transactions, accounts, budgets, insights)
      setMetrics(dashboardMetrics)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateDashboardMetrics = (transactions: any[], accounts: any[], budgets: any[], insights: any[]): DashboardMetrics => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Calculate totals
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    // Monthly calculations
    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth)
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlySavings = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

    // Today's spending
    const todayTransactions = transactions.filter(t => new Date(t.date) >= startOfDay)
    const todaySpending = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Budget utilization
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
    const budgetUtilization = totalBudget > 0 ? (monthlyExpenses / totalBudget) * 100 : 0

    // Recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Top categories
    const categorySpending = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
      .reduce((acc, t) => {
        const categoryName = t.categories?.name || 'Other'
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      budgetUtilization,
      recentTransactions,
      topCategories,
      aiInsights: insights,
      budgets
    }
  }

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return

    setIsAiLoading(true)
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()
      toast.success('AI Response: ' + data.response)
      setAiQuery('')
    } catch (err) {
      toast.error('Failed to get AI response')
    } finally {
      setIsAiLoading(false)
    }
  }

  // Use loaded data or fallback to defaults
  const totalBalance = metrics?.totalBalance ?? 0
  const monthlyIncome = metrics?.monthlyIncome ?? 0
  const monthlyExpenses = metrics?.monthlyExpenses ?? 0
  const monthlySavings = metrics?.monthlySavings ?? 0
  const savingsRate = metrics?.savingsRate ?? 0
  const budgetUtilization = metrics?.budgetUtilization ?? 0
  const todaySpending = metrics?.recentTransactions
    ?.filter(t => {
      const today = new Date()
      const transactionDate = new Date(t.date)
      return transactionDate.toDateString() === today.toDateString() && t.type === 'expense'
    })
    .reduce((sum, t) => sum + t.amount, 0) ?? 0

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadDashboardData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
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
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview for {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlySavings)}</div>
              <p className="text-xs text-muted-foreground">
                {savingsRate.toFixed(1)}% savings rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Spending</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todaySpending)}</div>
              <p className="text-xs text-muted-foreground">
                So far today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</div>
              <Progress value={budgetUtilization} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.recentTransactions?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No transactions yet</p>
                      <Button asChild>
                        <Link href="/dashboard/transactions">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Transaction
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    metrics?.recentTransactions?.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.categories?.name || 'Uncategorized'} • {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {metrics?.recentTransactions?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/dashboard/transactions">View All Transactions</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Chat Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Ask AI Assistant
                </CardTitle>
                <CardDescription>Get insights about your finances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about your spending patterns, budget recommendations..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiQuery()}
                      disabled={isAiLoading}
                    />
                    <Button onClick={handleAiQuery} disabled={isAiLoading || !aiQuery.trim()}>
                      {isAiLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Try: "What's my biggest expense category?" or "How can I save more this month?"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Categories</CardTitle>
                <CardDescription>This month's spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.topCategories?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No spending data yet</p>
                  ) : (
                    metrics?.topCategories?.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-primary`} style={{ opacity: 1 - (index * 0.2) }}></div>
                          <span className="text-sm font-medium">{category.category}</span>
                        </div>
                        <span className="text-sm font-semibold">${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard/transactions">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Transaction
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard/budgets">
                      <Target className="h-4 w-4 mr-2" />
                      Manage Budgets
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard/reports">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Reports
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Preview */}
            {metrics?.aiInsights?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.aiInsights.slice(0, 2).map((insight) => (
                      <div key={insight.id} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-1">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.content.substring(0, 80)}...</p>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href="/dashboard/reports?tab=insights">View All Insights</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
