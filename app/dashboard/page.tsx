'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, TrendingDown, CreditCard, ShoppingCart, Home, Utensils, Car, Plus, Filter, Download, Settings, Bell, User, Mountain } from 'lucide-react'
import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from 'lucide-react'

const spendingData = [
  { month: 'Jan', spending: 2400, budget: 3000 },
  { month: 'Feb', spending: 2800, budget: 3000 },
  { month: 'Mar', spending: 3200, budget: 3000 },
  { month: 'Apr', spending: 2600, budget: 3000 },
  { month: 'May', spending: 2900, budget: 3000 },
  { month: 'Jun', spending: 3400, budget: 3000 },
]

const categoryData = [
  { category: 'Food', amount: 850, color: 'hsl(var(--chart-1))' },
  { category: 'Transport', amount: 420, color: 'hsl(var(--chart-2))' },
  { category: 'Shopping', amount: 680, color: 'hsl(var(--chart-3))' },
  { category: 'Bills', amount: 1200, color: 'hsl(var(--chart-4))' },
  { category: 'Other', amount: 250, color: 'hsl(var(--chart-5))' },
]

const recentTransactions = [
  { id: 1, name: 'Grocery Store', category: 'Food', amount: -85.50, date: '2024-01-15', icon: ShoppingCart },
  { id: 2, name: 'Gas Station', category: 'Transport', amount: -45.00, date: '2024-01-14', icon: Car },
  { id: 3, name: 'Monthly Salary', category: 'Income', amount: 4500.00, date: '2024-01-13', icon: DollarSign },
  { id: 4, name: 'Restaurant', category: 'Food', amount: -62.30, date: '2024-01-12', icon: Utensils },
  { id: 5, name: 'Electric Bill', category: 'Bills', amount: -120.00, date: '2024-01-11', icon: Home },
  { id: 6, name: 'Online Shopping', category: 'Shopping', amount: -149.99, date: '2024-01-10', icon: ShoppingCart },
]

const budgetCategories = [
  { name: 'Food & Dining', spent: 850, budget: 1000, icon: Utensils, color: 'bg-chart-1' },
  { name: 'Transportation', spent: 420, budget: 500, icon: Car, color: 'bg-chart-2' },
  { name: 'Shopping', spent: 680, budget: 800, icon: ShoppingCart, color: 'bg-chart-3' },
  { name: 'Bills & Utilities', spent: 1200, budget: 1200, icon: Home, color: 'bg-chart-4' },
]

export default function Dashboard() {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const totalSpent = categoryData.reduce((sum, cat) => sum + cat.amount, 0)
  const totalBudget = 3000
  const budgetProgress = (totalSpent / totalBudget) * 100

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
              <Link href="/dashboard" className="text-sm font-medium text-foreground">
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
                  <Link href="/dashboard" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
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
                  <div className="border-t pt-4 mt-4">
                    <Link href="/dashboard/settings" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link href="/dashboard/profile" className="text-sm font-medium px-2 py-2 hover:bg-muted rounded-md flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 md:py-8">
        {/* Overview Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Link href="/dashboard/balance">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">$12,450.00</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/transactions">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month Spending</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">+8.2%</span> from last month
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/budgets">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">${(totalBudget - totalSpent).toFixed(2)}</div>
                <Progress value={budgetProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetProgress.toFixed(0)}% of ${totalBudget} budget used
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/savings">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Goal</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">$8,420.00</div>
                <Progress value={84} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  84% of $10,000 goal reached
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Left Column - Charts */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Spending Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your spending vs budget over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    spending: {
                      label: "Spending",
                      color: "hsl(var(--chart-1))",
                    },
                    budget: {
                      label: "Budget",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="budget" 
                        stroke="var(--color-budget)" 
                        fill="var(--color-budget)" 
                        fillOpacity={0.2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="var(--color-spending)" 
                        fill="var(--color-spending)" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Spending by Category</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current month breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Budget Categories */}
            <Link href="/dashboard/budgets">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Budget Categories</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Track your spending limits</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs hidden sm:flex">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Add Budget
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {budgetCategories.map((category, index) => {
                    const percentage = (category.spent / category.budget) * 100
                    const Icon = category.icon
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${category.color} bg-opacity-10 flex-shrink-0`}>
                              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-medium truncate">{category.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ${category.spent} / ${category.budget}
                              </p>
                            </div>
                          </div>
                          <Badge variant={percentage >= 100 ? "destructive" : percentage >= 80 ? "secondary" : "outline"} className="text-xs flex-shrink-0">
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Right Column - Transactions & Actions */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Manage your finances</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start text-sm" onClick={() => setIsAddingTransaction(!isAddingTransaction)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/dashboard/reports">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/dashboard/transactions">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Transactions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {isAddingTransaction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Add Transaction</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Record a new expense or income</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm">Description</Label>
                    <Input id="description" placeholder="e.g., Grocery shopping" className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm">Amount</Label>
                    <Input id="amount" type="number" placeholder="0.00" className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm">Category</Label>
                    <Select>
                      <SelectTrigger id="category" className="text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="transport">Transportation</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="bills">Bills & Utilities</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm">Date</Label>
                    <Input id="date" type="date" className="text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 text-sm">Save</Button>
                    <Button variant="outline" className="flex-1 text-sm" onClick={() => setIsAddingTransaction(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Link href="/dashboard/transactions">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Your latest activity</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {recentTransactions.slice(0, 5).map((transaction) => {
                      const Icon = transaction.icon
                      return (
                        <div key={transaction.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="p-1.5 sm:p-2 rounded-full bg-muted flex-shrink-0">
                              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-medium truncate">{transaction.name}</p>
                              <p className="text-xs text-muted-foreground">{transaction.date}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xs sm:text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                              {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Insights</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Smart recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Great job!</p>
                      <p className="text-xs text-blue-700 mt-1">
                        You're spending 15% less on dining this month compared to last month.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-amber-900">Budget Alert</p>
                      <p className="text-xs text-amber-700 mt-1">
                        You've used 85% of your shopping budget. Consider reducing spending to stay on track.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
