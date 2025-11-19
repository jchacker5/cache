'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react'
import Link from "next/link"
import { Line, LineChart, Bar, BarChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const monthlyData = [
  { month: 'Jan', income: 4500, expenses: 2400, savings: 2100, net: 2100 },
  { month: 'Feb', income: 5200, expenses: 2800, savings: 2400, net: 2400 },
  { month: 'Mar', income: 4800, expenses: 3200, savings: 1600, net: 1600 },
  { month: 'Apr', income: 4500, expenses: 2600, savings: 1900, net: 1900 },
  { month: 'May', income: 5500, expenses: 2900, savings: 2600, net: 2600 },
  { month: 'Jun', income: 4500, expenses: 3400, savings: 1100, net: 1100 },
]

const categoryTrends = [
  { month: 'Jan', food: 850, transport: 380, shopping: 540, bills: 1200 },
  { month: 'Feb', food: 920, transport: 420, shopping: 680, bills: 1200 },
  { month: 'Mar', food: 1100, transport: 450, shopping: 850, bills: 1200 },
  { month: 'Apr', food: 780, transport: 390, shopping: 620, bills: 1200 },
  { month: 'May', food: 950, transport: 480, shopping: 720, bills: 1200 },
  { month: 'Jun', food: 850, transport: 420, shopping: 680, bills: 1200 },
]

const weeklyData = [
  { week: 'Week 1', spent: 420, budget: 750 },
  { week: 'Week 2', spent: 580, budget: 750 },
  { week: 'Week 3', spent: 680, budget: 750 },
  { week: 'Week 4', spent: 850, budget: 750 },
]

const topExpenses = [
  { category: 'Bills & Utilities', amount: 1200, percentage: 40, change: 0 },
  { category: 'Food & Dining', amount: 850, percentage: 28, change: -5 },
  { category: 'Shopping', amount: 680, percentage: 23, change: 12 },
  { category: 'Transportation', amount: 420, percentage: 14, change: -2 },
  { category: 'Entertainment', amount: 250, percentage: 8, change: 25 },
]

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('6months')
  const [reportType, setReportType] = useState('overview')

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

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8.5%</span> vs last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3 text-red-500" />
                <span className="text-red-500">+12.3%</span> vs last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">${totalSavings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {savingsRate.toFixed(1)}% savings rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">${avgMonthlySpend.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-amber-500" />
                <span className="text-amber-500">+5.2%</span> vs last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">Comparison</TabsTrigger>
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
