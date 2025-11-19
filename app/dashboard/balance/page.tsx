'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Building2, ArrowUpRight, ArrowDownRight, Plus, Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react'
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DataService } from '@/lib/data-service'
import { useSafeUser } from '@/hooks/use-safe-user'
import { toast } from 'sonner'

interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  currency: string
  institution?: string
  account_number?: string
  last_four?: string
  is_active: boolean
  created_at: string
}

interface BalanceHistory {
  month: string
  balance: number
}

interface CashFlowData {
  month: string
  inflow: number
  outflow: number
}

export default function BalancePage() {
  const { user } = useSafeUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([])
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data for new account
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'credit' | 'investment',
    balance: '',
    institution: '',
    account_number: '',
    last_four: '',
  })

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load accounts and transactions
      const [accountsData, transactionsData] = await Promise.all([
        DataService.getAccounts(user.id),
        DataService.getTransactions(user.id)
      ])

      setAccounts(accountsData as any[])

      // Process balance history and cash flow data
      const processedData = processAccountData(accountsData as any[], transactionsData as any[])
      setBalanceHistory(processedData.balanceHistory)
      setCashFlowData(processedData.cashFlowData)
      setRecentTransactions(processedData.recentTransactions)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account data')
      console.error('Error loading account data:', err)
    } finally {
      setLoading(false)
    }
  }

  const processAccountData = (accounts: any[], transactions: any[]) => {
    // Calculate balance history over time
    const monthlyBalances: { [key: string]: number } = {}
    const monthlyCashFlow: { [key: string]: { inflow: number; outflow: number } } = {}

    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = date.toLocaleString('default', { month: 'short' })

      // Initialize if not exists
      if (!monthlyBalances[monthKey]) monthlyBalances[monthKey] = 0
      if (!monthlyCashFlow[monthKey]) monthlyCashFlow[monthKey] = { inflow: 0, outflow: 0 }

      // Update balance (simplified - in reality would need to track running balance)
      if (transaction.type === 'income') {
        monthlyBalances[monthKey] += transaction.amount
        monthlyCashFlow[monthKey].inflow += transaction.amount
      } else if (transaction.type === 'expense') {
        monthlyBalances[monthKey] -= transaction.amount
        monthlyCashFlow[monthKey].outflow += transaction.amount
      }
    })

    // Convert to arrays
    const balanceHistory: BalanceHistory[] = Object.entries(monthlyBalances)
      .map(([month, balance]) => ({ month, balance }))
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return months.indexOf(a.month) - months.indexOf(b.month)
      })

    const cashFlowData: CashFlowData[] = Object.entries(monthlyCashFlow)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return months.indexOf(a.month) - months.indexOf(b.month)
      })

    // Get recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return { balanceHistory, cashFlowData, recentTransactions }
  }

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.type) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const accountData = {
        ...newAccount,
        balance: parseFloat(newAccount.balance) || 0,
      }

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create account')
      }

      toast.success('Account created successfully')
      setIsAddDialogOpen(false)
      setNewAccount({
        name: '',
        type: 'checking',
        balance: '',
        institution: '',
        account_number: '',
        last_four: '',
      })

      // Reload data
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
      console.error('Error creating account:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete account')

      toast.success('Account deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete account')
      console.error('Error deleting account:', err)
    }
  }

  // Calculate derived metrics
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const liquidBalance = accounts.filter(a => a.type !== 'credit').reduce((sum, acc) => sum + acc.balance, 0)
  const creditUtilization = Math.abs(accounts.filter(a => a.type === 'credit').reduce((sum, acc) => sum + acc.balance, 0))

  const lastMonthBalance = balanceHistory[balanceHistory.length - 2]?.balance || 0
  const currentBalance = balanceHistory[balanceHistory.length - 1]?.balance || 0
  const balanceChange = lastMonthBalance > 0 ? ((currentBalance - lastMonthBalance) / lastMonthBalance) * 100 : 0

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return Wallet
      case 'savings': return Building2
      case 'credit': return CreditCard
      case 'investment': return TrendingUp
      default: return Wallet
    }
  }

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking': return '#3b82f6'
      case 'savings': return '#10b981'
      case 'credit': return '#ef4444'
      case 'investment': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your account data...</p>
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
              <h3 className="text-lg font-semibold mb-2">Failed to load accounts</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadData}>Try Again</Button>
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
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
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
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Balance Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor your accounts and net worth</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>Connect a new financial account to track your balance</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name *</Label>
                  <Input
                    id="account-name"
                    placeholder="e.g., Main Checking"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-type">Account Type *</Label>
                  <Select
                    value={newAccount.type}
                    onValueChange={(value: 'checking' | 'savings' | 'credit' | 'investment') =>
                      setNewAccount(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger id="account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-balance">Current Balance</Label>
                  <Input
                    id="account-balance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-institution">Institution (Optional)</Label>
                  <Input
                    id="account-institution"
                    placeholder="e.g., Chase Bank"
                    value={newAccount.institution}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, institution: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-last-four">Last 4 Digits (Optional)</Label>
                  <Input
                    id="account-last-four"
                    placeholder="1234"
                    maxLength={4}
                    value={newAccount.last_four}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, last_four: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleCreateAccount}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Account'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {balanceChange >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{balanceChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{balanceChange.toFixed(1)}%</span>
                  </>
                )}
                {' '}from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Liquid Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${liquidBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Available funds</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credit Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${creditUtilization.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Left Column - Accounts */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Accounts</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your connected financial accounts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {accounts.map((account) => {
                  const Icon = account.icon
                  return (
                    <div key={account.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${account.color}20` }}>
                            <Icon className="h-5 w-5" style={{ color: account.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base">{account.name}</h3>
                            <p className="text-xs text-muted-foreground">{account.bank} •••• {account.last4}</p>
                            <Badge variant="secondary" className="text-xs mt-2 capitalize">
                              {account.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg sm:text-xl font-bold ${account.balance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                            {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Balance History</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Net worth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    balance: {
                      label: "Balance",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="balance" stroke="var(--color-balance)" fill="var(--color-balance)" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Cash Flow Analysis</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Income vs expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    inflow: {
                      label: "Inflow",
                      color: "hsl(var(--chart-3))",
                    },
                    outflow: {
                      label: "Outflow",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Insights */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest transactions across accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description || activity.name}</p>
                        <p className="text-xs text-muted-foreground">{activity.account}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${activity.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                          {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toLocaleString()}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Financial Health</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Key metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-green-900">Positive Cash Flow</p>
                      <p className="text-xs text-green-700 mt-1">
                        Your net balance has increased by ${(currentBalance - lastMonthBalance).toFixed(0)} this month.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Savings Rate</p>
                      <p className="text-xs text-blue-700 mt-1">
                        You're saving {((8240 / (4500 + 850)) * 100).toFixed(1)}% of your monthly income. Great job!
                      </p>
                    </div>
                  </div>
                </div>
                {creditUtilization > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-amber-900">Credit Balance</p>
                        <p className="text-xs text-amber-700 mt-1">
                          You have ${creditUtilization.toLocaleString()} in credit card debt. Consider paying this down.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Checking Balance</span>
                  <span className="text-sm font-semibold">${accounts.find(a => a.type === 'checking')?.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Savings Balance</span>
                  <span className="text-sm font-semibold">${accounts.find(a => a.type === 'savings')?.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credit Card Debt</span>
                  <span className="text-sm font-semibold text-red-600">${Math.abs(accounts.find(a => a.type === 'credit')?.balance || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm font-medium">Net Worth</span>
                  <span className="text-sm font-bold">${totalBalance.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
