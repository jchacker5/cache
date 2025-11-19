// Simple data service for MVP - can be replaced with database calls later
// This simulates the database operations for the dashboard

export interface Transaction {
  id: string
  userId: string
  accountId: string
  categoryId: string
  amount: number
  type: 'income' | 'expense'
  description: string
  merchant: string
  date: string
  isRecurring: boolean
}

export interface Account {
  id: string
  userId: string
  name: string
  type: 'checking' | 'savings' | 'credit' | 'investment'
  balance: number
  currency: string
  institution: string
  isActive: boolean
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  spent: number
  alertThreshold: number
  isActive: boolean
}

// Mock data - in real app, this would come from database
const mockTransactions: Transaction[] = [
  // Recent transactions (last 30 days)
  { id: '1', userId: 'user1', accountId: 'acc1', categoryId: 'cat1', amount: 4500, type: 'income', description: 'Monthly Salary', merchant: 'Employer Inc.', date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: true },
  { id: '2', userId: 'user1', accountId: 'acc1', categoryId: 'cat1', amount: 850, type: 'income', description: 'Freelance Payment', merchant: 'Client ABC', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '3', userId: 'user1', accountId: 'acc1', categoryId: 'cat2', amount: -85.5, type: 'expense', description: 'Grocery Shopping', merchant: 'Whole Foods', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '4', userId: 'user1', accountId: 'acc1', categoryId: 'cat3', amount: -45, type: 'expense', description: 'Gas Station', merchant: 'Shell', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '5', userId: 'user1', accountId: 'acc1', categoryId: 'cat2', amount: -62.3, type: 'expense', description: 'Italian Dinner', merchant: 'Olive Garden', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '6', userId: 'user1', accountId: 'acc1', categoryId: 'cat4', amount: -120, type: 'expense', description: 'Electric Bill', merchant: 'Power Company', date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: true },
  { id: '7', userId: 'user1', accountId: 'acc1', categoryId: 'cat2', amount: -4.5, type: 'expense', description: 'Coffee', merchant: 'Starbucks', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '8', userId: 'user1', accountId: 'acc1', categoryId: 'cat3', amount: -18.75, type: 'expense', description: 'Uber Ride', merchant: 'Uber', date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '9', userId: 'user1', accountId: 'acc1', categoryId: 'cat4', amount: -50, type: 'expense', description: 'Gym Membership', merchant: 'Fitness Center', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: true },
  { id: '10', userId: 'user1', accountId: 'acc1', categoryId: 'cat3', amount: -52, type: 'expense', description: 'Gas Station', merchant: 'BP', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '11', userId: 'user1', accountId: 'acc1', categoryId: 'cat2', amount: -112.3, type: 'expense', description: 'Weekly Groceries', merchant: 'Trader Joe\'s', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '12', userId: 'user1', accountId: 'acc1', categoryId: 'cat5', amount: -35, type: 'expense', description: 'Movie Tickets', merchant: 'AMC', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '13', userId: 'user1', accountId: 'acc1', categoryId: 'cat4', amount: -79.99, type: 'expense', description: 'Internet Bill', merchant: 'Comcast', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: true },
  { id: '14', userId: 'user1', accountId: 'acc1', categoryId: 'cat2', amount: -45.2, type: 'expense', description: 'Lunch Out', merchant: 'Chipotle', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '15', userId: 'user1', accountId: 'acc2', categoryId: 'cat6', amount: -299.99, type: 'expense', description: 'New Headphones', merchant: 'Best Buy', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '16', userId: 'user1', accountId: 'acc2', categoryId: 'cat2', amount: -89.5, type: 'expense', description: 'Restaurant Dinner', merchant: 'The Capital Grille', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
  { id: '17', userId: 'user1', accountId: 'acc2', categoryId: 'cat5', amount: -125, type: 'expense', description: 'Concert Tickets', merchant: 'Ticketmaster', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: false },
]

const mockAccounts: Account[] = [
  { id: 'acc1', userId: 'user1', name: 'Main Checking', type: 'checking', balance: 5420.50, currency: 'USD', institution: 'Chase Bank', isActive: true },
  { id: 'acc2', userId: 'user1', name: 'High Yield Savings', type: 'savings', balance: 8240.00, currency: 'USD', institution: 'Chase Bank', isActive: true },
  { id: 'acc3', userId: 'user1', name: 'Credit Card', type: 'credit', balance: -1210.50, currency: 'USD', institution: 'Visa', isActive: true },
]

const mockBudgets: Budget[] = [
  { id: 'bud1', userId: 'user1', categoryId: 'cat2', name: 'Food & Dining', amount: 1000, period: 'monthly', spent: 850, alertThreshold: 0.9, isActive: true },
  { id: 'bud2', userId: 'user1', categoryId: 'cat3', name: 'Transportation', amount: 500, period: 'monthly', spent: 420, alertThreshold: 0.9, isActive: true },
  { id: 'bud3', userId: 'user1', categoryId: 'cat6', name: 'Shopping', amount: 800, period: 'monthly', spent: 680, alertThreshold: 0.9, isActive: true },
  { id: 'bud4', userId: 'user1', categoryId: 'cat4', name: 'Bills & Utilities', amount: 1200, period: 'monthly', spent: 1200, alertThreshold: 0.9, isActive: true },
  { id: 'bud5', userId: 'user1', categoryId: 'cat5', name: 'Entertainment', amount: 300, period: 'monthly', spent: 180, alertThreshold: 0.9, isActive: true },
]

// Data service functions
export class DataService {
  static async getDashboardMetrics(userId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    const userTransactions = mockTransactions.filter(t => t.userId === userId)
    const userAccounts = mockAccounts.filter(a => a.userId === userId)

    // Calculate metrics
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const last28DaysStart = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
    const last365DaysStart = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

    // Today's spending
    const todaySpending = Math.abs(
      userTransactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= todayStart)
        .reduce((sum, t) => sum + t.amount, 0)
    )

    // Last 28 days spending
    const last28DaysSpending = Math.abs(
      userTransactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= last28DaysStart)
        .reduce((sum, t) => sum + t.amount, 0)
    )

    // Last 365 days spending
    const last365DaysSpending = Math.abs(
      userTransactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= last365DaysStart)
        .reduce((sum, t) => sum + t.amount, 0)
    )

    // Cash (total liquid assets)
    const cash = userAccounts
      .filter(a => a.type !== 'credit')
      .reduce((sum, a) => sum + a.balance, 0)

    // Monthly burn rate (last 30 days average spending)
    const monthlyBurn = last28DaysSpending * (30/28)

    // Runway (months of cash left at current burn rate)
    const runway = cash > 0 && monthlyBurn > 0 ? cash / monthlyBurn : 0

    return {
      cash,
      burn: monthlyBurn,
      runway,
      todaySpending,
      last28Days: last28DaysSpending,
      last365Days: last365DaysSpending,
    }
  }

  static async getRecentTransactions(userId: string, limit: number = 10) {
    await new Promise(resolve => setTimeout(resolve, 50))

    return mockTransactions
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  static async getTransactions(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockTransactions.filter(t => t.userId === userId)
  }

  static async getAccounts(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockAccounts.filter(a => a.userId === userId)
  }

  static async getBudgets(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockBudgets.filter(b => b.userId === userId)
  }

  static async getSavingsGoals(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 50))
    return []
  }

  static async getAiInsights(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 50))
    return []
  }
}
