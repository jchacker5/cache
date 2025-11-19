'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight, FileText, Loader2, AlertCircle, Lightbulb, Target } from 'lucide-react'
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useSafeUser } from '@/hooks/use-safe-user'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'

interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
  net: number
}

interface CategoryData {
  [key: string]: any
  month: string
}

interface WeeklyData {
  week: string
  spent: number
  budget: number
}

interface TopExpense {
  category: string
  amount: number
  percentage: number
  change: number
}

interface AIInsight {
  id: string
  type: string
  title: string
  content: string
  data?: any
  created_at: string
}

export default function ReportsPage() {
  const { user } = useSafeUser()
  const [timeRange, setTimeRange] = useState('6months')
  const [reportType, setReportType] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real data states
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryTrends, setCategoryTrends] = useState<CategoryData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [topExpenses, setTopExpenses] = useState<TopExpense[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadReportData()
      loadAiInsights()
    }
  }, [user, timeRange])

  const loadReportData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load transactions data for reports
      const transactions = await DataService.getTransactions(user.id)

      // Process data for different report types
      const processedData = processReportData(transactions as any[])
      setMonthlyData(processedData.monthlyData)
      setCategoryTrends(processedData.categoryTrends)
      setWeeklyData(processedData.weeklyData)
      setTopExpenses(processedData.topExpenses)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data')
      console.error('Error loading report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAiInsights = async () => {
    if (!user?.id) return

    try {
      const insights = await DataService.getAiInsights(user.id)
      setAiInsights(insights as any[])
    } catch (err) {
      console.error('Error loading AI insights:', err)
    }
  }

  const processReportData = (transactions: any[]) => {
    // Group transactions by month
    const monthlyGroups = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date)
      const monthKey = date.toLocaleString('default', { month: 'short' })

      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0, transactions: [] }
      }

      if (transaction.type === 'income') {
        acc[monthKey].income += transaction.amount
      } else if (transaction.type === 'expense') {
        acc[monthKey].expenses += transaction.amount
      }

      acc[monthKey].transactions.push(transaction)
      return acc
    }, {} as Record<string, any>)

    // Convert to monthly data format
    const monthlyData: MonthlyData[] = Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      savings: data.income - data.expenses,
      net: data.income - data.expenses,
    }))

    // Process category trends
    const categoryGroups = transactions.reduce((acc, transaction) => {
      if (transaction.type !== 'expense') return acc

      const date = new Date(transaction.date)
      const monthKey = date.toLocaleString('default', { month: 'short' })
      const categoryName = transaction.categories?.name || 'Other'

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey }
      }

      acc[monthKey][categoryName] = (acc[monthKey][categoryName] || 0) + transaction.amount
      return acc
    }, {} as Record<string, any>)

    const categoryTrends: CategoryData[] = Object.values(categoryGroups)

    // Process weekly data (simplified)
    const weeklyData: WeeklyData[] = [
      { week: 'Week 1', spent: 420, budget: 750 },
      { week: 'Week 2', spent: 580, budget: 750 },
      { week: 'Week 3', spent: 680, budget: 750 },
      { week: 'Week 4', spent: 850, budget: 750 },
    ]

    // Process top expenses
    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const categoryName = transaction.categories?.name || 'Other'
        acc[categoryName] = (acc[categoryName] || 0) + transaction.amount
        return acc
      }, {} as Record<string, number>)

    const totalExpenses = Object.values(expenseByCategory).reduce((sum, amount) => sum + amount, 0)
    const topExpenses: TopExpense[] = Object.entries(expenseByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        change: Math.random() * 50 - 25, // Mock change data
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return { monthlyData, categoryTrends, weeklyData, topExpenses }
  }

  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0)
  const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0)
  const totalSavings = monthlyData.reduce((sum, d) => sum + d.savings, 0)
  const avgMonthlySpend = totalExpenses / monthlyData.length
  const savingsRate = (totalSavings / totalIncome) * 100

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
              <Link href="/dashboard/reports" className="text-sm font-medium text-foreground">
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
                  <Link href="/dashboard/reports" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Analyze your spending patterns and financial health</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button variant="outline" size="sm" onClick={loadReportData} className="ml-auto">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last {monthlyData.length} months
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(totalExpenses / Math.max(monthlyData.length, 1)).toFixed(0)}/month avg
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold">${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0}% savings rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold">${(totalExpenses / Math.max(monthlyData.length, 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average monthly spend
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">Comparison</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Income vs Expenses</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Monthly comparison over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      income: {
                        label: "Income",
                        color: "hsl(var(--chart-1))",
                      },
                      expenses: {
                        label: "Expenses",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[250px] sm:h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} />
                        <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Net Savings</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Monthly savings accumulation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      savings: {
                        label: "Savings",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[250px] sm:h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="savings" stroke="var(--color-savings)" fill="var(--color-savings)" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top Expense Categories</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Breakdown of spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topExpenses.map((expense, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{expense.category}</span>
                          <Badge variant={expense.change > 0 ? "destructive" : expense.change < 0 ? "default" : "secondary"} className="text-xs flex-shrink-0">
                            {expense.change > 0 ? '+' : ''}{expense.change}%
                          </Badge>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold">${expense.amount}</p>
                          <p className="text-xs text-muted-foreground">{expense.percentage}%</p>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${expense.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Category Spending Trends</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Track how your spending evolves over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    food: { label: "Food", color: "hsl(var(--chart-1))" },
                    transport: { label: "Transport", color: "hsl(var(--chart-2))" },
                    shopping: { label: "Shopping", color: "hsl(var(--chart-3))" },
                    bills: { label: "Bills", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[300px] sm:h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={categoryTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="food" stroke="var(--color-food)" strokeWidth={2} />
                      <Line type="monotone" dataKey="transport" stroke="var(--color-transport)" strokeWidth={2} />
                      <Line type="monotone" dataKey="shopping" stroke="var(--color-shopping)" strokeWidth={2} />
                      <Line type="monotone" dataKey="bills" stroke="var(--color-bills)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Trend Analysis</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Key insights from your spending</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <TrendingDown className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Food Spending Decreased</p>
                      <p className="text-xs text-green-700 mt-1">You've reduced food spending by 18% compared to 3 months ago.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Shopping Increased</p>
                      <p className="text-xs text-amber-700 mt-1">Shopping expenses are up 25% this month. Consider setting a stricter budget.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <DollarSign className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Bills Consistent</p>
                      <p className="text-xs text-blue-700 mt-1">Your bills have remained steady at $1,200/month.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Spending Velocity</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Current month progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      spent: { label: "Spent", color: "hsl(var(--chart-1))" },
                      budget: { label: "Budget", color: "hsl(var(--chart-2))" },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="budget" fill="var(--color-budget)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Category Breakdown</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detailed spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: { label: "Amount", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px] sm:h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExpenses} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">vs Last Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">+8.2%</div>
                  <p className="text-xs text-muted-foreground mt-1">$2,900 vs $2,680</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">vs Last Quarter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">-5.3%</div>
                  <p className="text-xs text-muted-foreground mt-1">Average improvement</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">vs Last Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">+12.8%</div>
                  <p className="text-xs text-muted-foreground mt-1">Year over year</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Period Comparison</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Compare spending across time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topExpenses.slice(0, 3).map((category, index) => (
                    <div key={index} className="space-y-2 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{category.category}</h4>
                        <Badge variant={category.change > 0 ? "destructive" : "default"}>
                          {category.change > 0 ? '+' : ''}{category.change}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">This Month</p>
                          <p className="text-sm font-bold">${category.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Month</p>
                          <p className="text-sm font-bold">${(category.amount * (1 - category.change / 100)).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Difference</p>
                          <p className={`text-sm font-bold ${category.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${Math.abs(category.amount * category.change / 100).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Intelligent analysis of your spending patterns and financial health
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    // Loading skeletons for insights
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-full"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : aiInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No AI insights available yet</p>
                      <p className="text-sm text-muted-foreground">
                        Insights will be generated as you add more transaction data
                      </p>
                    </div>
                  ) : (
                    aiInsights.map((insight) => (
                      <div key={insight.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <Lightbulb className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{insight.title}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {insight.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(insight.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Spending Predictions</CardTitle>
                    <CardDescription>AI-powered forecasting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">Next Month</p>
                          <p className="text-xs text-muted-foreground">Predicted expenses</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(totalExpenses / Math.max(monthlyData.length, 1) * 1.05).toFixed(0)}</p>
                          <p className="text-xs text-amber-600">+5% increase</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">End of Quarter</p>
                          <p className="text-xs text-muted-foreground">Projected savings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(totalSavings * 0.95).toFixed(0)}</p>
                          <p className="text-xs text-green-600">Maintained</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Smart Recommendations</CardTitle>
                    <CardDescription>Personalized financial advice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-green-800">Increase Emergency Fund</p>
                          <p className="text-xs text-green-700">You're on track to save $2,500 more this quarter</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <TrendingDown className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-amber-800">Reduce Dining Out</p>
                          <p className="text-xs text-amber-700">Food expenses are up 15% from last month</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-blue-800">Savings Goal Progress</p>
                          <p className="text-xs text-blue-700">You're 65% toward your vacation fund goal</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Export Options</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Download your reports in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Email Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
