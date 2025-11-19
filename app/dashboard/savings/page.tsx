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
import { Mountain, Menu, Bell, Settings, User, Plus, Edit, Trash2, Target, HomeIcon, Car, Plane, GraduationCap, TrendingUp, Calendar, DollarSign, Check, AlertCircle, Loader2 } from 'lucide-react'
import Link from "next/link"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  priority: string
  category?: string
  monthly_contribution: number
  description?: string
  is_completed: boolean
  created_at: string
  progress?: number
  remaining?: number
  months_to_goal?: number
  is_overdue?: boolean
}

export default function SavingsPage() {
  const { user } = useUser()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isContributeOpen, setIsContributeOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)

  // Form data for new goal
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'lifestyle',
    monthly_contribution: '',
    description: '',
  })

  // Form data for contribution
  const [contribution, setContribution] = useState({
    amount: '',
    notes: '',
  })

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/savings-goals')
      if (!response.ok) throw new Error('Failed to load savings goals')

      const data = await response.json()
      setGoals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings goals')
      console.error('Error loading savings goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const goalData = {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount) || 0,
        monthly_contribution: parseFloat(newGoal.monthly_contribution) || 0,
      }

      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create savings goal')
      }

      toast.success('Savings goal created successfully')
      setIsAddDialogOpen(false)
      setNewGoal({
        name: '',
        target_amount: '',
        current_amount: '0',
        deadline: '',
        priority: 'medium',
        category: 'lifestyle',
        monthly_contribution: '',
        description: '',
      })

      // Reload data
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create savings goal')
      console.error('Error creating savings goal:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContributeToGoal = async () => {
    if (!selectedGoal || !contribution.amount) {
      toast.error('Please enter a contribution amount')
      return
    }

    try {
      const response = await fetch(`/api/savings-goals/${selectedGoal.id}?action=contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(contribution.amount),
          notes: contribution.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add contribution')
      }

      toast.success('Contribution added successfully')
      setIsContributeOpen(false)
      setSelectedGoal(null)
      setContribution({ amount: '', notes: '' })

      // Reload data
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add contribution')
      console.error('Error adding contribution:', err)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return

    try {
      const response = await fetch(`/api/savings-goals/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete savings goal')

      toast.success('Savings goal deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete savings goal')
      console.error('Error deleting savings goal:', err)
    }
  }

  // Calculate summary stats
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
  const totalMonthlyContribution = goals.reduce((sum, g) => sum + g.monthly_contribution, 0)

  const goalsAchieved = goals.filter(g => g.is_completed || g.current_amount >= g.target_amount).length
  const goalsInProgress = goals.filter(g => !g.is_completed && g.current_amount < g.target_amount).length

  // Calculate savings history (last 6 months)
  const savingsHistory = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthKey = date.toLocaleString('default', { month: 'short' })
    const monthTotal = goals.reduce((sum, goal) => {
      // Simplified: assume linear progress
      const monthsSinceStart = i
      const projected = goal.current_amount + (goal.monthly_contribution * monthsSinceStart)
      return sum + Math.min(projected, goal.target_amount)
    }, 0)
    return { month: monthKey, total: monthTotal }
  })

  // Calculate projection data (next 6 months)
  const projectionData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    if (i < 6) {
      date.setMonth(date.getMonth() - (5 - i))
    } else {
      date.setMonth(date.getMonth() + (i - 5))
    }
    const monthKey = date.toLocaleString('default', { month: 'short' })
    const actual = i < 6 ? savingsHistory[i]?.total || 0 : null
    const projected = goals.reduce((sum, goal) => {
      const monthsAhead = Math.max(0, i - 5)
      const projected = goal.current_amount + (goal.monthly_contribution * monthsAhead)
      return sum + Math.min(projected, goal.target_amount)
    }, 0)
    return { month: monthKey, actual, projected }
  })

  const deleteGoal = (id: string) => {
    handleDeleteGoal(id)
  }

  const contributeToGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal)
    setIsContributeOpen(true)
  }

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null
    const today = new Date()
    const target = new Date(deadline)
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getStatusColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return 'default'
    if (percentage >= 75) return 'default'
    if (percentage >= 50) return 'secondary'
    return 'outline'
  }

  const getStatusText = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 100) return 'Completed'
    if (percentage >= 75) return 'Almost There'
    if (percentage >= 50) return 'In Progress'
    return 'Started'
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
              <Link href="/dashboard/savings" className="text-sm font-medium text-foreground">
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
                  <Link href="/dashboard/savings" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Savings Goals</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and achieve your financial goals</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>Set a new financial goal to track</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-name">Goal Name *</Label>
                  <Input
                    id="goal-name"
                    placeholder="e.g., Vacation Fund"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target Amount *</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-current">Current Savings</Label>
                  <Input
                    id="goal-current"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, current_amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-deadline">Target Date</Label>
                  <Input
                    id="goal-deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-monthly">Monthly Contribution</Label>
                  <Input
                    id="goal-monthly"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newGoal.monthly_contribution}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, monthly_contribution: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-priority">Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') =>
                      setNewGoal(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger id="goal-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-category">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) =>
                      setNewGoal(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger id="goal-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essential">Essential</SelectItem>
                      <SelectItem value="major">Major Purchase</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-description">Description</Label>
                  <Input
                    id="goal-description"
                    placeholder="Optional description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleCreateGoal}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Goal'
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">{totalProgress.toFixed(1)}% of target</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <Progress value={totalProgress} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Goals Achieved</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{goalsAchieved}</div>
                  <p className="text-xs text-muted-foreground mt-1">{goalsInProgress} in progress</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">${totalMonthlyContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-7">
          {/* Left Column - Goals List */}
          <div className="lg:col-span-4 space-y-4">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-muted rounded w-3/4"></div>
                            <div className="h-6 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-muted rounded"></div>
                          <div className="w-8 h-8 bg-muted rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-4 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-muted rounded w-24"></div>
                        <div className="h-8 bg-muted rounded w-32"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : goals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No savings goals created yet</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              goals.map((goal) => {
                const percentage = (goal.current_amount / goal.target_amount) * 100
                const remaining = goal.target_amount - goal.current_amount
                const daysRemaining = getDaysRemaining(goal.deadline)
                const isCompleted = goal.is_completed || goal.current_amount >= goal.target_amount
                const monthsToGoal = goal.monthly_contribution > 0 ? remaining / goal.monthly_contribution : 0
              
              return (
                <Card key={goal.id} className={isCompleted ? 'border-green-500 border-2' : ''}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-3 rounded-lg flex-shrink-0 bg-primary/10">
                            <Target className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-base sm:text-lg">{goal.name}</h3>
                              <Badge variant={getStatusColor(goal.current_amount, goal.target_amount)}>
                                {getStatusText(goal.current_amount, goal.target_amount)}
                              </Badge>
                              {isCompleted && (
                                <Badge className="bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Achieved
                                </Badge>
                              )}
                              {goal.priority && (
                                <Badge variant="outline" className="capitalize">
                                  {goal.priority} priority
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xl sm:text-2xl font-bold">${goal.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              <span className="text-sm text-muted-foreground">of ${goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => contributeToGoal(goal)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress value={percentage} className="h-3" />
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">{percentage.toFixed(1)}% saved</span>
                          <span className={remaining > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                            {remaining > 0 ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} to go` : 'Goal Achieved!'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">Target Date</span>
                          </div>
                          <p className="text-sm font-semibold">{goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</p>
                          <p className="text-xs text-muted-foreground">{daysRemaining && daysRemaining > 0 ? `${daysRemaining} days left` : goal.deadline ? 'Past due' : 'No deadline set'}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="text-xs">Monthly</span>
                          </div>
                          <p className="text-sm font-semibold">${goal.monthly_contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">
                            {!isCompleted && monthsToGoal > 0 ? `${Math.ceil(monthsToGoal)} months to goal` : 'Completed'}
                          </p>
                        </div>
                      </div>

                      {!isCompleted && daysRemaining < 90 && remaining > 0 && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            You need to save ${(remaining / (daysRemaining / 30)).toFixed(0)}/month to reach this goal on time.
                          </p>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-green-800">
                            Congratulations! You've achieved this savings goal. Consider setting a new goal.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
              })
            )}
          </div>

          {/* Right Column - Analytics */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Savings Growth</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Total savings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Total Savings",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[200px] sm:h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Savings Projection</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Estimated future savings</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    actual: {
                      label: "Actual",
                      color: "hsl(var(--chart-1))",
                    },
                    projected: {
                      label: "Projected",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[200px] sm:h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="projected" stroke="var(--color-projected)" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Based on current monthly contributions of ${totalMonthlyContribution}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Insights</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Smart recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {goalsAchieved > 0 && (
                  <div className="p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-green-900">Great Progress!</p>
                        <p className="text-xs text-green-700 mt-1">
                          You've achieved {goalsAchieved} {goalsAchieved === 1 ? 'goal' : 'goals'}. Keep up the excellent work!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-900">Savings Tip</p>
                      <p className="text-xs text-blue-700 mt-1">
                        You're contributing ${totalMonthlyContribution}/month. Consider increasing by 10% to reach goals faster.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-purple-900">On Track</p>
                      <p className="text-xs text-purple-700 mt-1">
                        Based on current contributions, you'll reach your emergency fund goal in {Math.ceil((10000 - 8420) / 450)} months.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Goal Progress</span>
                  <span className="text-sm font-semibold">
                    {goals.length > 0 ? (goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / goals.length).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Closest to Completion</span>
                  <span className="text-sm font-semibold">
                    {goals.length > 0 ? goals.sort((a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount))[0]?.name || 'N/A' : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Remaining</span>
                  <span className="text-sm font-semibold">
                    ${(totalTarget - totalSaved).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Contribute Dialog */}
      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription>
              Add money to {selectedGoal?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Amount *</Label>
              <Input
                id="contribution-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={contribution.amount}
                onChange={(e) => setContribution(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-notes">Notes (Optional)</Label>
              <Input
                id="contribution-notes"
                placeholder="e.g., Monthly contribution"
                value={contribution.notes}
                onChange={(e) => setContribution(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="text-sm font-semibold">${selectedGoal?.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Target</span>
                <span className="text-sm font-semibold">${selectedGoal?.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-semibold">{selectedGoal ? ((selectedGoal.current_amount / selectedGoal.target_amount) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleContributeToGoal}
                disabled={!contribution.amount}
              >
                Add Contribution
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsContributeOpen(false)
                  setSelectedGoal(null)
                  setContribution({ amount: '', notes: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
