'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Mountain, Menu, Bell, Settings, User, Plus, Filter, Download, Search, Edit, Trash2, ShoppingCart, Car, Home, Utensils, DollarSign, Calendar, ArrowUpDown } from 'lucide-react'
import Link from "next/link"

const allTransactions = [
  { id: 1, name: 'Grocery Store', category: 'Food', amount: -85.50, date: '2024-01-15', status: 'completed', icon: ShoppingCart, merchant: 'Whole Foods' },
  { id: 2, name: 'Gas Station', category: 'Transport', amount: -45.00, date: '2024-01-14', status: 'completed', icon: Car, merchant: 'Shell' },
  { id: 3, name: 'Monthly Salary', category: 'Income', amount: 4500.00, date: '2024-01-13', status: 'completed', icon: DollarSign, merchant: 'Employer' },
  { id: 4, name: 'Restaurant', category: 'Food', amount: -62.30, date: '2024-01-12', status: 'completed', icon: Utensils, merchant: 'Italian Bistro' },
  { id: 5, name: 'Electric Bill', category: 'Bills', amount: -120.00, date: '2024-01-11', status: 'pending', icon: Home, merchant: 'Power Co.' },
  { id: 6, name: 'Online Shopping', category: 'Shopping', amount: -149.99, date: '2024-01-10', status: 'completed', icon: ShoppingCart, merchant: 'Amazon' },
  { id: 7, name: 'Coffee Shop', category: 'Food', amount: -4.50, date: '2024-01-10', status: 'completed', icon: Utensils, merchant: 'Starbucks' },
  { id: 8, name: 'Uber Ride', category: 'Transport', amount: -18.75, date: '2024-01-09', status: 'completed', icon: Car, merchant: 'Uber' },
  { id: 9, name: 'Gym Membership', category: 'Bills', amount: -50.00, date: '2024-01-08', status: 'completed', icon: Home, merchant: 'Fitness Center' },
  { id: 10, name: 'Freelance Payment', category: 'Income', amount: 850.00, date: '2024-01-07', status: 'completed', icon: DollarSign, merchant: 'Client A' },
  { id: 11, name: 'Gas Station', category: 'Transport', amount: -52.00, date: '2024-01-06', status: 'completed', icon: Car, merchant: 'BP' },
  { id: 12, name: 'Grocery Store', category: 'Food', amount: -112.30, date: '2024-01-05', status: 'completed', icon: ShoppingCart, merchant: 'Trader Joes' },
  { id: 13, name: 'Movie Tickets', category: 'Entertainment', amount: -35.00, date: '2024-01-04', status: 'completed', icon: ShoppingCart, merchant: 'AMC Theatres' },
  { id: 14, name: 'Internet Bill', category: 'Bills', amount: -79.99, date: '2024-01-03', status: 'completed', icon: Home, merchant: 'ISP Provider' },
  { id: 15, name: 'Restaurant', category: 'Food', amount: -45.20, date: '2024-01-02', status: 'completed', icon: Utensils, merchant: 'Sushi Place' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(allTransactions)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<typeof allTransactions[0] | null>(null)

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.merchant.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const deleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

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
                  <Label htmlFor="new-name">Description</Label>
                  <Input id="new-name" placeholder="e.g., Grocery shopping" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-merchant">Merchant</Label>
                  <Input id="new-merchant" placeholder="e.g., Whole Foods" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-amount">Amount</Label>
                  <Input id="new-amount" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category</Label>
                  <Select>
                    <SelectTrigger id="new-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="bills">Bills & Utilities</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-date">Date</Label>
                  <Input id="new-date" type="date" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => setIsAddDialogOpen(false)}>Save Transaction</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <SelectItem value="Food">Food & Dining</SelectItem>
                    <SelectItem value="Transport">Transportation</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Bills">Bills & Utilities</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const Icon = transaction.icon
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          {transaction.name}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.merchant}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTransaction(transaction.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transactions List - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.map((transaction) => {
            const Icon = transaction.icon
            return (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-full bg-muted flex-shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{transaction.name}</p>
                        <p className="text-xs text-muted-foreground">{transaction.merchant}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{transaction.category}</Badge>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold mb-2 ${transaction.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTransaction(transaction.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
