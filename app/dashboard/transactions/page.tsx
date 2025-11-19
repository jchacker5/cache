'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, Plus, Filter, Download, Search, Edit, Trash2, ShoppingCart, Car, Home, Utensils, DollarSign, Calendar, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { useUser } from '@clerk/nextjs'
import { categorizeTransaction } from '@/lib/ai/categorize'
import { toast } from 'sonner'
import { DataService } from '@/lib/data-service'

interface Transaction {
  id: string
  description: string
  merchant?: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  date: string
  notes?: string
  tags?: string[]
  ai_categorized?: boolean
  ai_confidence?: number
  accounts: {
    name: string
    type: string
    currency: string
  }
  categories?: {
    name: string
    icon?: string
    color?: string
  }
}

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
}

export default function TransactionsPage() {
  const { user } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data for new transaction
  const [newTransaction, setNewTransaction] = useState({
    account_id: '',
    description: '',
    merchant: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, currentPage, searchQuery, categoryFilter, accountFilter, typeFilter, sortOrder])

  const loadData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Get all transactions from data service
      const allTransactions = await DataService.getTransactions(user.id)

      // Apply filters and sorting
      let filteredTransactions = allTransactions

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredTransactions = filteredTransactions.filter(t =>
          t.description.toLowerCase().includes(query) ||
          t.merchant?.toLowerCase().includes(query)
        )
      }

      // Category filter (simplified - would need category lookup)
      if (categoryFilter !== 'all') {
        // For MVP, we'll skip category filtering since we don't have category names
      }

      // Account filter
      if (accountFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.accountId === accountFilter)
      }

      // Type filter
      if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter)
      }

      // Sort by date
      filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })

      // Pagination
      const startIndex = (currentPage - 1) * 20
      const endIndex = startIndex + 20
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

      setTransactions(paginatedTransactions as any)
      setTotalPages(Math.ceil(filteredTransactions.length / 20))
      setTotalTransactions(filteredTransactions.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
      console.error('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load accounts and categories for dropdowns
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!user?.id) return

      try {
        const [accountsData] = await Promise.all([
          DataService.getAccounts(user.id)
        ])

        setAccounts(accountsData as any)
        // For MVP, we'll use hardcoded categories
        setCategories([
          { id: 'cat1', name: 'Food & Dining', icon: 'utensils', color: '#3b82f6' },
          { id: 'cat2', name: 'Transportation', icon: 'car', color: '#8b5cf6' },
          { id: 'cat3', name: 'Shopping', icon: 'shopping-cart', color: '#ec4899' },
          { id: 'cat4', name: 'Bills & Utilities', icon: 'home', color: '#f59e0b' },
          { id: 'cat5', name: 'Entertainment', icon: 'tv', color: '#10b981' },
        ])
      } catch (err) {
        console.error('Error loading reference data:', err)
      }
    }

    if (user) {
      loadReferenceData()
    }
  }, [user])

  const handleCreateTransaction = async () => {
    if (!newTransaction.account_id || !newTransaction.description || !newTransaction.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Auto-categorize if it's an expense
      let categoryId = undefined
      if (newTransaction.type === 'expense') {
        try {
          const categorization = await categorizeTransaction({
            description: newTransaction.description,
            merchant: newTransaction.merchant,
            amount: parseFloat(newTransaction.amount),
          })

          // Find matching category
          const matchingCategory = categories.find(c => c.name === categorization.category)
          if (matchingCategory) {
            categoryId = matchingCategory.id
          }
        } catch (err) {
          console.error('AI categorization failed:', err)
          // Continue without categorization
        }
      }

      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        category_id: categoryId,
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      toast.success('Transaction created successfully')
      setIsAddDialogOpen(false)
      setNewTransaction({
        account_id: '',
        description: '',
        merchant: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })

      // Reload data
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create transaction')
      console.error('Error creating transaction:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete transaction')

      toast.success('Transaction deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete transaction')
      console.error('Error deleting transaction:', err)
    }
  }

  // Calculate summary stats
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
  const netAmount = totalIncome - totalExpense

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
              <Link href="/dashboard/transactions" className="text-sm font-medium text-foreground">
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
                  <Link href="/dashboard/transactions" className="text-sm font-medium px-2 py-2 rounded-md bg-muted">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage all your financial transactions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>Record a new income or expense transaction</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-description">Description *</Label>
                  <Input
                    id="new-description"
                    placeholder="e.g., Grocery shopping"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-merchant">Merchant</Label>
                  <Input
                    id="new-merchant"
                    placeholder="e.g., Whole Foods"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-amount">Amount *</Label>
                    <Input
                      id="new-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-type">Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: 'income' | 'expense' | 'transfer') =>
                        setNewTransaction(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger id="new-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-account">Account *</Label>
                  <Select
                    value={newTransaction.account_id}
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, account_id: value }))}
                  >
                    <SelectTrigger id="new-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-date">Date</Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-notes">Notes</Label>
                  <Input
                    id="new-notes"
                    placeholder="Optional notes"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleCreateTransaction}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Save Transaction'
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{transactions.filter(t => t.amount > 0).length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-${totalExpense.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{transactions.filter(t => t.amount < 0).length} transactions</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netAmount >= 0 ? '+' : ''}${netAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current period balance</p>
            </CardContent>
          </Card>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-filter" className="text-sm">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-filter" className="text-sm">Account</Label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger id="account-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-filter" className="text-sm">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Actions</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table - Desktop */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-muted">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.ai_categorized && (
                              <Badge variant="outline" className="text-xs mt-1">
                                AI categorized
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.accounts?.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {transaction.categories?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* Transactions List - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading transactions...</p>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No transactions found
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-full bg-muted flex-shrink-0">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.merchant || transaction.accounts?.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.categories?.name || 'Uncategorized'}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {transaction.type}
                          </Badge>
                          {transaction.ai_categorized && (
                            <Badge variant="outline" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold mb-2 ${transaction.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No transactions found matching your filters</p>
              <Button className="mt-4" onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
                setStatusFilter('all')
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
