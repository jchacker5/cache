'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, Plus, Edit, Trash2, ShoppingCart, Car, Home, Utensils, Smartphone, Coffee, TrendingUp, TrendingDown, AlertTriangle, Loader2, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartContainer } from "@/components/ui/chart"
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

interface Budget {
  id: string
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  spent: number
  start_date: string
  end_date?: string
  alert_threshold: number
  is_active: boolean
  categories?: {
    name: string
    icon?: string
    color?: string
  }
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

export default function BudgetsPage() {
  const { user } = useUser()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data for new budget
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    name: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    alert_threshold: '0.9',
  })

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
      loadCategories()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/budgets')
      if (!response.ok) throw new Error('Failed to load budgets')

      const data = await response.json()
      setBudgets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets')
      console.error('Error loading budgets:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const handleCreateBudget = async () => {
    if (!newBudget.category_id || !newBudget.name || !newBudget.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const budgetData = {
        ...newBudget,
        amount: parseFloat(newBudget.amount),
        alert_threshold: parseFloat(newBudget.alert_threshold),
      }

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create budget')
      }

      toast.success('Budget created successfully')
      setIsAddDialogOpen(false)
      setNewBudget({
        category_id: '',
        name: '',
        amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        alert_threshold: '0.9',
      })

      // Reload data
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create budget')
      console.error('Error creating budget:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete budget')

      toast.success('Budget deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete budget')
      console.error('Error deleting budget:', err)
    }
  }

  // Calculate summary stats
  const totalBudget = budgets.filter(b => b.period === 'monthly').reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.filter(b => b.period === 'monthly').reduce((sum, b) => sum + b.spent, 0)
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const budgetsAtRisk = budgets.filter(b => {
    const percentage = (b.spent / b.amount) * 100
    return percentage >= b.alert_threshold * 100
  }).length
  const budgetsOnTrack = budgets.filter(b => (b.spent / b.amount) < 0.75).length

  const pieChartData = budgets.filter(b => b.period === 'monthly').map(b => ({
    name: b.categories?.name || b.name,
    value: b.spent,
    color: b.categories?.color || '#6b7280'
  }))

  const getStatusColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return 'destructive'
    if (percentage >= 90) return 'secondary'
    return 'outline'
  }

  const getStatusText = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return 'Over Budget'
    if (percentage >= 90) return 'At Risk'
    if (percentage >= 75) return 'Warning'
    return 'On Track'
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
              <Link href="/dashboard/budgets" className="text-sm font-medium text-foreground">
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
                  <Link href="/dashboard/budgets" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Set spending limits and track your budget across categories</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>Set a spending limit for a category</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-name">Budget Name *</Label>
                  <Input
                    id="budget-name"
                    placeholder="e.g., Monthly Groceries"
                    value={newBudget.name}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-category">Category *</Label>
                  <Select
                    value={newBudget.category_id}
                    onValueChange={(value) => setNewBudget(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger id="budget-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-amount">Budget Amount *</Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget-period">Period</Label>
                    <Select
                      value={newBudget.period}
                      onValueChange={(value: 'weekly' | 'monthly' | 'yearly') =>
                        setNewBudget(prev => ({ ...prev, period: value }))
                      }
                    >
                      <SelectTrigger id="budget-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-start-date">Start Date</Label>
                  <Input
                    id="budget-start-date"
                    type="date"
                    value={newBudget.start_date}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-alert-threshold">Alert Threshold (%)</Label>
                  <Input
                    id="budget-alert-threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    placeholder="0.9"
                    value={newBudget.alert_threshold}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, alert_threshold: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when budget usage exceeds this percentage (0.9 = 90%)
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleCreateBudget}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Budget'
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

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button variant="outline" size="sm" onClick={loadData} className="ml-auto">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">{budgets.filter(b => b.period === 'monthly').length} categories</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-2 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <Progress value={overallProgress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">{overallProgress.toFixed(0)}% of budget used</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budgets At Risk</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-600">{budgetsAtRisk}</div>
                  <p className="text-xs text-muted-foreground mt-1">90% or more spent</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">On Track</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{budgetsOnTrack}</div>
                  <p className="text-xs text-muted-foreground mt-1">Below 75% spent</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Left Column - Budget List */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Categories</CardTitle>
                <CardDescription>Track spending limits for each category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-3 p-4 rounded-lg border bg-card animate-pulse">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-muted rounded"></div>
                          <div className="w-8 h-8 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2.5 bg-muted rounded"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : budgets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No budgets created yet</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Budget
                    </Button>
                  </div>
                ) : (
                  budgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100
                    const remaining = budget.amount - budget.spent

                    return (
                      <div key={budget.id} className="space-y-3 p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="p-2.5 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${budget.categories?.color || '#6b7280'}20` }}
                            >
                              <div
                                className="w-5 h-5 rounded"
                                style={{ backgroundColor: budget.categories?.color || '#6b7280' }}
                              ></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm sm:text-base">{budget.name}</h3>
                                <Badge variant={getStatusColor(budget.spent, budget.amount)} className="text-xs">
                                  {getStatusText(budget.spent, budget.amount)}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {budget.period}
                                </Badge>
                              </div>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-lg font-bold">${budget.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span className="text-sm text-muted-foreground">of ${budget.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteBudget(budget.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Progress value={percentage} className="h-2.5" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{percentage.toFixed(1)}% used</span>
                            <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {remaining >= 0 ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} left` : `$${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })} over`}
                            </span>
                          </div>
                        </div>

                        {percentage >= budget.alert_threshold * 100 && (
                          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800">
                              {percentage >= 100
                                ? `You've exceeded this budget by $${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Consider adjusting your spending.`
                                : `You've used ${percentage.toFixed(0)}% of this budget. Only $${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining.`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Visualization & Insights */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spending Distribution</CardTitle>
                <CardDescription>Visual breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Insights</CardTitle>
                <CardDescription>Smart recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgetsAtRisk > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-red-900">Budget Alert</p>
                        <p className="text-xs text-red-700 mt-1">
                          {budgetsAtRisk} {budgetsAtRisk === 1 ? 'category is' : 'categories are'} at risk of exceeding the budget. Consider reducing spending.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {budgetsOnTrack > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-green-900">Great Progress</p>
                        <p className="text-xs text-green-700 mt-1">
                          {budgetsOnTrack} {budgetsOnTrack === 1 ? 'category is' : 'categories are'} well within budget. Keep up the good work!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Budget Tip</p>
                      <p className="text-xs text-blue-700 mt-1">
                        You have ${(totalBudget - totalSpent).toFixed(2)} remaining for the month. Consider saving the surplus or adjusting future budgets.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Budget performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Budget Usage</span>
                  <span className="text-sm font-semibold">{(budgets.reduce((sum, b) => sum + (b.spent / b.budget) * 100, 0) / budgets.length).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Highest Spend Category</span>
                  <span className="text-sm font-semibold">{budgets.sort((a, b) => b.spent - a.spent)[0].name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Most Efficient Category</span>
                  <span className="text-sm font-semibold">
                    {budgets.sort((a, b) => (a.spent / a.budget) - (b.spent / b.budget))[0].name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Categories</span>
                  <span className="text-sm font-semibold">{budgets.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
